import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const StartWithTemplateSection = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [experience, setExperience] = useState("");

  const jobTitles = [
    { value: "software-engineer", label: "Software Engineer" },
    { value: "marketing-manager", label: "Marketing Manager" },
    { value: "project-manager", label: "Project Manager" },
    { value: "graphic-designer", label: "Graphic Designer" },
    { value: "data-analyst", label: "Data Analyst" },
  ];

  const industries = [
    { value: "technology", label: "Technology" },
    { value: "healthcare", label: "Healthcare" },
    { value: "finance", label: "Finance" },
    { value: "education", label: "Education" },
    { value: "retail", label: "Retail" },
  ];

  const experienceLevels = [
    { value: "entry-level", label: "Entry Level" },
    { value: "mid-level", label: "Mid Level" },
    { value: "senior", label: "Senior" },
    { value: "executive", label: "Executive" },
    { value: "student", label: "Student" },
  ];

  return (
    <section className="bg-gray-light py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Start Your Resume with a Template</h2>
          <p className="text-lg text-gray-dark max-w-2xl mx-auto">
            Select your job details to find the perfect template for your career
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Job Title Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2">Job Title</label>
              <Select value={jobTitle} onValueChange={setJobTitle}>
                <SelectTrigger className="w-full border border-gray-300 rounded-lg p-3 bg-gray-light focus:border-primary focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder="Select Job Title" />
                </SelectTrigger>
                <SelectContent>
                  {jobTitles.map((job) => (
                    <SelectItem key={job.value} value={job.value}>{job.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Industry Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2">Industry</label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="w-full border border-gray-300 rounded-lg p-3 bg-gray-light focus:border-primary focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder="Select Industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Experience Level Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2">Experience Level</label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger className="w-full border border-gray-300 rounded-lg p-3 bg-gray-light focus:border-primary focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder="Select Experience" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((exp) => (
                    <SelectItem key={exp.value} value={exp.value}>{exp.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-center">
            <Button
              className="bg-secondary hover:bg-yellow-500 text-black font-bold py-3 px-8 text-lg shadow-md"
            >
              Start Resume
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StartWithTemplateSection;
