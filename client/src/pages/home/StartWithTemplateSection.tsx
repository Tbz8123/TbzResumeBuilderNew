import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { SectionContainer, SectionHeading, CardStyles } from "@/components/ui/CardStyles";
import { CTAButton } from "@/components/ui/ButtonStyles";

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
    <SectionContainer background="light">
      <SectionHeading
        title="Start Your Resume with a Template"
        subtitle="Select your job details to find the perfect template for your career"
        className="mb-10"
      />

      <CardStyles variant="default" className="max-w-3xl mx-auto p-8">
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
          <CTAButton>
            Start Resume
          </CTAButton>
        </div>
      </CardStyles>
    </SectionContainer>
  );
};

export default StartWithTemplateSection;
