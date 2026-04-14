import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  assertUserRole,
  HttpError,
  listTaskSets,
  listTasks,
  toTaskLanguage,
} from "../lib/classroom";
import { sendControllerError } from "../lib/responses";
import { supabaseAdmin } from "../supabaseClient";

type ImportedTaskPayload = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  inputFormat?: unknown;
  outputFormat?: unknown;
  examples?: unknown;
  starterCode?: unknown;
  solutionSteps?: unknown;
  constraints?: unknown;
};

type ImportedTaskSetPayload = {
  id?: unknown;
  title?: unknown;
  topic?: unknown;
  description?: unknown;
  language?: unknown;
  tasks?: unknown;
};

type NormalizedImportTask = {
  importId: string;
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  starterCode: string;
  constraints: string[];
  examples: Array<{ input: string; expectedOutput: string }>;
  solutionSteps: Array<{ id: string; title: string; description: string }>;
};

const supportedLanguages = new Set(["python", "javascript", "typescript"]);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const requireNonEmptyString = (value: unknown, field: string) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${field} is required.`);
  }

  return value.trim();
};

const optionalString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const parseExamples = (value: unknown, taskLabel: string) => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new HttpError(400, `${taskLabel} examples must be an array.`);
  }

  return value.map((example, index) => {
    if (!isPlainObject(example)) {
      throw new HttpError(400, `${taskLabel} example ${index + 1} must be an object.`);
    }

    return {
      input: requireNonEmptyString(example.input, `${taskLabel} example ${index + 1} input`),
      expectedOutput: requireNonEmptyString(
        example.output,
        `${taskLabel} example ${index + 1} output`,
      ),
    };
  });
};

const parseStringArray = (value: unknown, field: string) => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new HttpError(400, `${field} must be an array.`);
  }

  return value.map((entry, index) =>
    requireNonEmptyString(entry, `${field} item ${index + 1}`),
  );
};

const normalizeImportTask = (value: unknown, position: number): NormalizedImportTask => {
  if (!isPlainObject(value)) {
    throw new HttpError(400, `Task ${position + 1} must be an object.`);
  }

  const importId = requireNonEmptyString(value.id, `Task ${position + 1} id`);
  const title = requireNonEmptyString(value.title, `Task ${position + 1} title`);
  const description = requireNonEmptyString(
    value.description,
    `Task ${position + 1} description`,
  );
  const starterCode = requireNonEmptyString(
    value.starterCode,
    `Task ${position + 1} starterCode`,
  );
  const inputFormat = optionalString(value.inputFormat);
  const outputFormat = optionalString(value.outputFormat);
  const constraints = parseStringArray(value.constraints, `Task ${position + 1} constraints`);
  const examples = parseExamples(value.examples, `Task ${position + 1}`);
  const rawSolutionSteps = parseStringArray(
    value.solutionSteps,
    `Task ${position + 1} solutionSteps`,
  );

  return {
    importId,
    title,
    description,
    inputFormat,
    outputFormat,
    starterCode,
    constraints,
    examples,
    solutionSteps: rawSolutionSteps.map((step, index) => ({
      id: `${importId}-step-${index + 1}`,
      title: `Step ${index + 1}`,
      description: step,
    })),
  };
};

const parseTaskSetPayload = (body: unknown) => {
  let payload: unknown = body;

  if (isPlainObject(body) && typeof body.content === "string") {
    if (body.fileName && (typeof body.fileName !== "string" || !body.fileName.endsWith(".json"))) {
      throw new HttpError(400, "Please upload a valid .json file.");
    }

    try {
      payload = JSON.parse(body.content);
    } catch (error) {
      throw new HttpError(400, "Failed to parse uploaded JSON.");
    }
  }

  if (!isPlainObject(payload)) {
    throw new HttpError(400, "Invalid payload. Expected a task set JSON object.");
  }

  const taskSet = payload as ImportedTaskSetPayload;
  const id = requireNonEmptyString(taskSet.id, "Task set id");
  const title = requireNonEmptyString(taskSet.title, "Task set title");
  const topic = requireNonEmptyString(taskSet.topic, "Task set topic");
  const description = optionalString(taskSet.description);
  const language = requireNonEmptyString(taskSet.language, "Task set language");

  if (!supportedLanguages.has(language)) {
    throw new HttpError(400, `Unsupported task set language: ${language}.`);
  }

  if (!Array.isArray(taskSet.tasks) || taskSet.tasks.length === 0) {
    throw new HttpError(400, "Task set must include a non-empty tasks array.");
  }

  const tasks = taskSet.tasks.map(normalizeImportTask);
  const seenTaskIds = new Set<string>();
  for (const task of tasks) {
    if (seenTaskIds.has(task.importId)) {
      throw new HttpError(400, `Duplicate task id detected: ${task.importId}.`);
    }
    seenTaskIds.add(task.importId);
  }

  return {
    id,
    title,
    topic,
    description,
    language: toTaskLanguage(language),
    tasks,
  };
};

export const handleImportTaskSet = async (req: AuthenticatedRequest, res: Response) => {
  let createdTaskSetId: string | null = null;
  let createdTaskIds: string[] = [];

  try {
    const userId = req.user!.id;
    await assertUserRole(userId, ["teacher"]);

    const payload = parseTaskSetPayload(req.body);

    const { data: existingTaskSet, error: existingError } = await supabaseAdmin
      .from("task_sets")
      .select("id")
      .eq("id", payload.id)
      .maybeSingle();

    if (existingError) {
      throw new HttpError(500, `Failed to validate task set id: ${existingError.message}`);
    }

    if (existingTaskSet) {
      throw new HttpError(409, `Task set "${payload.id}" already exists.`);
    }

    const { error: insertTaskSetError } = await supabaseAdmin.from("task_sets").insert({
      id: payload.id,
      title: payload.title,
      topic: payload.topic,
      description: payload.description,
      language: payload.language,
      source_type: "json_import",
    });

    if (insertTaskSetError) {
      throw new HttpError(500, `Failed to create task set: ${insertTaskSetError.message}`);
    }

    createdTaskSetId = payload.id;

    const { data: insertedTasks, error: insertTasksError } = await supabaseAdmin
      .from("tasks")
      .insert(
        payload.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          initial_code: task.starterCode,
          test_cases: task.examples,
          input_format: task.inputFormat,
          output_format: task.outputFormat,
          constraints: task.constraints,
          external_id: task.importId,
          language: payload.language,
          difficulty: "Medium",
          logic_steps: task.solutionSteps,
        })),
      )
      .select("id, external_id");

    if (insertTasksError) {
      throw new HttpError(500, `Failed to insert tasks: ${insertTasksError.message}`);
    }

    const taskIdByImportId = new Map<string, string>();
    for (const row of insertedTasks ?? []) {
      if (row.external_id) {
        taskIdByImportId.set(row.external_id, row.id);
        createdTaskIds.push(row.id);
      }
    }

    const taskSetTasks = payload.tasks.map((task, index) => {
      const taskId = taskIdByImportId.get(task.importId);
      if (!taskId) {
        throw new HttpError(500, `Inserted task is missing for ${task.importId}.`);
      }

      return {
        task_set_id: payload.id,
        task_id: taskId,
        position: index,
      };
    });

    const { error: linkError } = await supabaseAdmin
      .from("task_set_tasks")
      .insert(taskSetTasks);

    if (linkError) {
      throw new HttpError(500, `Failed to link task set tasks: ${linkError.message}`);
    }

    const taskSets = await listTaskSets();
    const taskSet = taskSets.find((entry) => entry.id === payload.id);
    res.status(201).json({
      success: true,
      count: payload.tasks.length,
      taskSet: taskSet ?? null,
    });
  } catch (err) {
    if (createdTaskIds.length > 0) {
      await supabaseAdmin.from("tasks").delete().in("id", createdTaskIds);
    }

    if (createdTaskSetId) {
      await supabaseAdmin.from("task_sets").delete().eq("id", createdTaskSetId);
    }

    sendControllerError(res, err);
  }
};

export const handleTasksImport = handleImportTaskSet;

export const handleListTaskSets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await assertUserRole(userId, ["teacher"]);
    const taskSets = await listTaskSets();
    res.json({ success: true, taskSets });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleListTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await assertUserRole(userId, ["teacher"]);
    const tasks = await listTasks();
    res.json({ success: true, tasks });
  } catch (error) {
    sendControllerError(res, error);
  }
};
