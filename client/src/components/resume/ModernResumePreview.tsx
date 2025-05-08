import React, { useEffect, useState } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { Phone, Mail, MapPin, Globe, Linkedin, Award, Briefcase, GraduationCap, User } from 'lucide-react';

interface ModernResumePreviewProps {
  className?: string;
  scale?: number;
}

const ModernResumePreview: React.FC<ModernResumePreviewProps> = ({ 
  className = '',
  scale = 0.22
}) => {
  const { resumeData } = useResume();
  const fullName = `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim();
  
  return (
    <div 
      className={`modern-resume-preview ${className}`}
      style={{ 
        transform: `scale(${scale})`, 
        transformOrigin: 'top left',
        width: '794px', // A4 width at 96 DPI
        height: '1123px', // A4 height
        overflow: 'hidden',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div className="resume-container" style={{ display: 'flex', height: '100%' }}>
        {/* Left Sidebar - Dark blue background */}
        <div style={{ 
          width: '200px', 
          backgroundColor: '#1e3a8a', // Dark blue
          color: 'white',
          padding: '30px 20px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          {/* Profile Photo */}
          <div style={{ 
            width: '140px', 
            height: '140px', 
            borderRadius: '50%', 
            overflow: 'hidden',
            margin: '0 auto 20px',
            border: '4px solid #2563eb', // Medium blue
            backgroundColor: '#cbd5e1', // Light slate
          }}>
            {resumeData.photo ? (
              <img 
                src={resumeData.photo} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '40px',
                color: '#1e3a8a',
                backgroundColor: '#e2e8f0',
              }}>
                {fullName ? fullName.charAt(0).toUpperCase() : ''}
              </div>
            )}
          </div>
          
          {/* Contact Info */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '5px',
              marginBottom: '15px',
              color: '#93c5fd', // Light blue
            }}>
              Contact
            </h2>
            
            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {resumeData.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Phone size={14} color="#93c5fd" />
                  <span>{resumeData.phone}</span>
                </div>
              )}
              
              {resumeData.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', wordBreak: 'break-word' }}>
                  <Mail size={14} color="#93c5fd" />
                  <span>{resumeData.email}</span>
                </div>
              )}
              
              {(resumeData.city || resumeData.country) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <MapPin size={14} color="#93c5fd" />
                  <span>{[resumeData.city, resumeData.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              
              {resumeData.additionalInfo.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', wordBreak: 'break-word' }}>
                  <Globe size={14} color="#93c5fd" />
                  <span>{resumeData.additionalInfo.website}</span>
                </div>
              )}
              
              {resumeData.additionalInfo.linkedin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', wordBreak: 'break-word' }}>
                  <Linkedin size={14} color="#93c5fd" />
                  <span>{resumeData.additionalInfo.linkedin}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Skills Section */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '5px',
              marginBottom: '15px',
              color: '#93c5fd', // Light blue
            }}>
              Skills
            </h2>
            
            <div style={{ fontSize: '12px' }}>
              {resumeData.skills && resumeData.skills.length > 0 ? (
                <ul style={{ paddingLeft: '15px' }}>
                  {resumeData.skills.map((skill, index) => (
                    <li key={index}>{skill.name}</li>
                  ))}
                </ul>
              ) : (
                <ul style={{ paddingLeft: '15px' }}>
                  <li>Communication</li>
                  <li>Problem Solving</li>
                  <li>Teamwork</li>
                  <li>Adaptability</li>
                </ul>
              )}
            </div>
          </div>
          
          {/* Education Section in Sidebar */}
          <div>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              textTransform: 'uppercase',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '5px',
              marginBottom: '15px',
              color: '#93c5fd', // Light blue
            }}>
              Education
            </h2>
            
            <div style={{ fontSize: '12px' }}>
              {resumeData.education && resumeData.education.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {resumeData.education.map((edu, index) => (
                    <div key={index}>
                      <p style={{ fontWeight: 'bold' }}>{edu.degree}</p>
                      <p style={{ fontStyle: 'italic' }}>{edu.institution}</p>
                      <p>{`${edu.startDate} - ${edu.endDate}`}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 'bold' }}>Bachelor's Degree</p>
                  <p style={{ fontStyle: 'italic' }}>University Name</p>
                  <p>2016 - 2020</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content - Right side */}
        <div style={{ 
          flex: 1, 
          padding: '30px 25px',
          display: 'flex',
          flexDirection: 'column',
          gap: '25px',
        }}>
          {/* Header - Name and Title */}
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ 
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1e3a8a',
              marginBottom: '5px',
              letterSpacing: '0.5px',
            }}>
              {fullName || 'Your Name'}
            </h1>
            <h2 style={{ 
              fontSize: '18px',
              color: '#3b82f6',
              fontWeight: '500',
            }}>
              {resumeData.profession || 'Professional Title'}
            </h2>
          </div>
          
          {/* Professional Summary */}
          <div>
            <h3 style={{ 
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1e3a8a',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '5px',
              marginBottom: '10px',
              textTransform: 'uppercase',
            }}>
              Professional Summary
            </h3>
            <p style={{ 
              fontSize: '12px', 
              lineHeight: '1.5',
              color: '#334155', // Slate 700
            }}>
              {resumeData.summary || 'A results-driven professional with experience in [industry/field]. Skilled in [key skills] with a proven track record of [major achievements]. Seeking to leverage my expertise in a challenging role to drive organizational success.'}
            </p>
          </div>
          
          {/* Work Experience */}
          <div>
            <h3 style={{ 
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1e3a8a',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '5px',
              marginBottom: '15px',
              textTransform: 'uppercase',
            }}>
              Work Experience
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {resumeData.workExperience && resumeData.workExperience.length > 0 ? (
                resumeData.workExperience.map((exp, index) => (
                  <div key={index} style={{ fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <h4 style={{ fontWeight: 'bold', color: '#1e40af' }}>{exp.jobTitle}</h4>
                      <span style={{ color: '#64748b' }}>
                        {`${exp.startDate} - ${exp.isCurrentPosition ? 'Present' : exp.endDate}`}
                      </span>
                    </div>
                    <p style={{ fontStyle: 'italic', marginBottom: '5px', color: '#475569' }}>
                      {`${exp.employer}${exp.location ? `, ${exp.location}` : ''}`}
                    </p>
                    <p style={{ lineHeight: '1.5', color: '#334155' }}>{exp.description}</p>
                  </div>
                ))
              ) : (
                <>
                  <div style={{ fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <h4 style={{ fontWeight: 'bold', color: '#1e40af' }}>Job Title 1</h4>
                      <span style={{ color: '#64748b' }}>2021 - Present</span>
                    </div>
                    <p style={{ fontStyle: 'italic', marginBottom: '5px', color: '#475569' }}>
                      Company Name, Location
                    </p>
                    <p style={{ lineHeight: '1.5', color: '#334155' }}>
                      Describe your responsibilities and achievements in this role. Highlight specific projects, 
                      quantifiable results, and relevant skills that demonstrate your expertise.
                    </p>
                  </div>
                  
                  <div style={{ fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <h4 style={{ fontWeight: 'bold', color: '#1e40af' }}>Job Title 2</h4>
                      <span style={{ color: '#64748b' }}>2018 - 2021</span>
                    </div>
                    <p style={{ fontStyle: 'italic', marginBottom: '5px', color: '#475569' }}>
                      Company Name, Location
                    </p>
                    <p style={{ lineHeight: '1.5', color: '#334155' }}>
                      Describe your responsibilities and achievements in this role. Focus on transferable skills 
                      and accomplishments that are relevant to your target position.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Certifications Section (Optional) */}
          <div>
            <h3 style={{ 
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1e3a8a',
              borderBottom: '2px solid #3b82f6',
              paddingBottom: '5px',
              marginBottom: '10px',
              textTransform: 'uppercase',
            }}>
              Certifications
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Award size={14} color="#3b82f6" />
                <span>Professional Certification in {resumeData.profession || 'Your Field'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Award size={14} color="#3b82f6" />
                <span>Advanced Training in Industry-Specific Skills</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernResumePreview;