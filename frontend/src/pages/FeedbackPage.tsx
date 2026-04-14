import { motion } from "framer-motion";
import React, { useState } from "react";
import { Link } from "@/lib/router";
import { appPaths } from "@/app/paths";
import { Send, CheckCircle2, ChevronLeft } from "lucide-react";
import { authorizedJsonFetch } from "@/services/api";
import iconLogo from "@/assets/icon_logo.png";

const FeedbackPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    gender: "",
    ageGroup: "",
    country: "",
    bugDescription: "",
    description: "",
    imageUrl: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await authorizedJsonFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[80vh] px-4 py-16 bg-white relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border-[3px] border-[#11110f] bg-[#ccff00] p-12 shadow-[8px_8px_0_#11110f] max-w-lg text-center"
        >
          <CheckCircle2 className="w-20 h-20 mx-auto mb-6 text-[#11110f]" />
          <h2 className="text-3xl font-black uppercase tracking-tight text-[#11110f] mb-4">
            Thank You!
          </h2>
          <p className="font-medium text-lg text-[#11110f]/80 mb-8">
            Your feedback has been submitted successfully. If eligible, your account will be granted 1 week of free iCode soon!
          </p>
          <Link
            to={appPaths.home}
            className="inline-flex items-center justify-center px-8 py-4 bg-[#11110f] text-white font-bold uppercase tracking-wider hover:bg-[#11110f]/90 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <section className="px-4 pb-24 pt-12 sm:px-6 lg:px-8 bg-white min-h-[90vh] flex flex-col justify-start relative z-0 border-b border-[rgba(17,17,15,0.05)]">
      <div className="mx-auto max-w-[800px] w-full text-left relative z-10 flex flex-col items-start mt-8">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col-reverse sm:flex-row sm:items-center justify-between w-full gap-6 sm:gap-4 mb-8"
        >
          <h1 className="text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.05em] text-[#11110f] sm:text-[3.5rem] lg:text-[4rem]">
            Help us build<br />a better iCode.
          </h1>
          <img src={iconLogo} alt="iCode" className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 object-contain ml-auto sm:ml-0 transform scale-x-[-1]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="mb-10 w-full"
        >
          <div className="inline-flex items-center gap-3 border-[3px] border-[#11110f] bg-[#ccff00] px-5 py-3 font-mono text-sm font-black uppercase tracking-widest text-[#11110f] shadow-[6px_6px_0_#11110f]">
            <span>🎁 Reward:</span>
            <span className="normal-case tracking-normal">For your feedback, we will grant 1 week of free iCode instead of 2k tenge.</span>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="w-full border-t-[3px] border-[#11110f] pt-10"
        >
          {error && (
            <div className="mb-8 p-4 bg-rose-100 border-2 border-rose-500 text-rose-700 font-bold shadow-[4px_4px_0_#f43f5e]">
              Error: {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="flex flex-col">
              <label className="font-bold text-sm uppercase tracking-widest text-[#11110f] mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-transparent border-2 border-[#11110f] px-4 py-3 text-base font-semibold focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#11110f] transition-colors appearance-none rounded-none shadow-[2px_2px_0_#11110f]"
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-bold text-sm uppercase tracking-widest text-[#11110f] mb-2">Age</label>
              <select
                name="ageGroup"
                value={formData.ageGroup}
                onChange={handleChange}
                className="w-full bg-transparent border-2 border-[#11110f] px-4 py-3 text-base font-semibold focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#11110f] transition-colors appearance-none rounded-none shadow-[2px_2px_0_#11110f]"
              >
                <option value="">Select...</option>
                <option value="Under 12">Under 12</option>
                <option value="12-14">12 - 14</option>
                <option value="15-18">15 - 18</option>
                <option value="19-24">19 - 24</option>
                <option value="25+">25+</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-bold text-sm uppercase tracking-widest text-[#11110f] mb-2">Country</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full bg-transparent border-2 border-[#11110f] px-4 py-3 text-base font-semibold focus:outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#11110f] transition-colors appearance-none rounded-none shadow-[2px_2px_0_#11110f]"
              >
                <option value="">Select...</option>
                <option value="Kazakhstan">Kazakhstan</option>
                <option value="Russia">Russia</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col mb-8">
            <label className="font-bold text-sm uppercase tracking-widest text-[#11110f] mb-2">Bug Report <span className="text-gray-400 normal-case tracking-normal">(Optional)</span></label>
            <textarea
              name="bugDescription"
              value={formData.bugDescription}
              onChange={handleChange}
              rows={3}
              placeholder="Did you encounter any technical issues?"
              className="w-full bg-white border-2 border-[#11110f] px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:border-[#11110f] transition-all rounded-none shadow-[4px_4px_0_#11110f] resize-y placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col mb-8">
            <label className="font-bold text-sm uppercase tracking-widest text-[#11110f] mb-2">General Feedback</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="What do you love? What can we improve?"
              required
              className="w-full bg-white border-2 border-[#11110f] px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:border-[#11110f] transition-all rounded-none shadow-[4px_4px_0_#11110f] resize-y placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col mb-12">
            <label className="font-bold text-sm uppercase tracking-widest text-[#11110f] mb-2">Screenshot <span className="text-gray-400 normal-case tracking-normal">(Optional)</span></label>
            <div className="w-full bg-[#fafafa] border-2 border-dashed border-[#11110f] hover:bg-[#11110f]/5 px-4 py-10 text-center cursor-pointer transition-all rounded-none shadow-[4px_4px_0_#11110f] relative flex items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({ ...formData, imageUrl: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="font-bold text-base uppercase tracking-widest text-[#11110f]">
                {formData.imageUrl ? "Image Selected - Click or Drop to change" : "Click or Drag & Drop Image Here"}
              </span>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center rounded-none px-10 py-5 bg-[#ccff00] text-[#11110f] font-black uppercase text-xl border-[3px] border-[#11110f] shadow-[6px_6px_0_#11110f] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0_#11110f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : (
                <>
                  <Send className="w-6 h-6 mr-3" />
                  Submit Feedback
                </>
              )}
            </button>
          </motion.div>
        </motion.form>
      </div>
    </section>
  );
};

export default FeedbackPage;
