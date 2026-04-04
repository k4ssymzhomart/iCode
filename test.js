import { exec } from 'child_process';
exec('python3 --version', (err, stdout, stderr) => {
  console.log(stdout || stderr);
});
