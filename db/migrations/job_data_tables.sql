-- Create the job_titles table
CREATE TABLE IF NOT EXISTS job_titles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create the job_descriptions table
CREATE TABLE IF NOT EXISTS job_descriptions (
  id SERIAL PRIMARY KEY,
  job_title_id INTEGER NOT NULL REFERENCES job_titles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_recommended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Insert sample job titles if needed
INSERT INTO job_titles (title, category)
VALUES 
  ('Product Manager', 'Management'),
  ('Software Engineer', 'Technology'),
  ('Marketing Manager', 'Marketing'),
  ('Financial Analyst', 'Finance'),
  ('Graphic Designer', 'Creative')
ON CONFLICT (title) DO NOTHING;

-- Insert sample descriptions for Product Manager
INSERT INTO job_descriptions (job_title_id, content, is_recommended)
VALUES 
  ((SELECT id FROM job_titles WHERE title = 'Product Manager'), 'Led cross-functional teams to deliver product features, increasing efficiency by 25%.', TRUE),
  ((SELECT id FROM job_titles WHERE title = 'Product Manager'), 'Developed strategic roadmaps resulting in 30% growth year over year.', FALSE),
  ((SELECT id FROM job_titles WHERE title = 'Product Manager'), 'Implemented new product development processes that reduced time-to-market by 15%.', TRUE)
ON CONFLICT DO NOTHING;

-- Insert sample descriptions for Software Engineer
INSERT INTO job_descriptions (job_title_id, content, is_recommended)
VALUES 
  ((SELECT id FROM job_titles WHERE title = 'Software Engineer'), 'Developed high-performance, scalable applications using React and Node.js.', TRUE),
  ((SELECT id FROM job_titles WHERE title = 'Software Engineer'), 'Implemented automated testing solutions, reducing bugs in production by 40%.', TRUE),
  ((SELECT id FROM job_titles WHERE title = 'Software Engineer'), 'Optimized database queries, resulting in a 50% improvement in application response time.', FALSE)
ON CONFLICT DO NOTHING;

-- Insert sample descriptions for Marketing Manager
INSERT INTO job_descriptions (job_title_id, content, is_recommended)
VALUES 
  ((SELECT id FROM job_titles WHERE title = 'Marketing Manager'), 'Launched successful digital marketing campaigns, increasing lead generation by 35%.', TRUE),
  ((SELECT id FROM job_titles WHERE title = 'Marketing Manager'), 'Managed a team of 5 marketing professionals, consistently meeting quarterly targets.', FALSE),
  ((SELECT id FROM job_titles WHERE title = 'Marketing Manager'), 'Developed and executed content strategy, resulting in 45% increase in website traffic.', TRUE)
ON CONFLICT DO NOTHING;

-- Insert sample descriptions for Financial Analyst
INSERT INTO job_descriptions (job_title_id, content, is_recommended)
VALUES 
  ((SELECT id FROM job_titles WHERE title = 'Financial Analyst'), 'Conducted financial analysis and forecasting, identifying $1.2M in cost-saving opportunities.', TRUE),
  ((SELECT id FROM job_titles WHERE title = 'Financial Analyst'), 'Prepared monthly financial reports and presentations for senior management.', FALSE),
  ((SELECT id FROM job_titles WHERE title = 'Financial Analyst'), 'Developed financial models to evaluate potential acquisitions and business opportunities.', TRUE)
ON CONFLICT DO NOTHING;

-- Insert sample descriptions for Graphic Designer
INSERT INTO job_descriptions (job_title_id, content, is_recommended)
VALUES 
  ((SELECT id FROM job_titles WHERE title = 'Graphic Designer'), 'Created compelling visual content for marketing campaigns, increasing engagement by 28%.', TRUE),
  ((SELECT id FROM job_titles WHERE title = 'Graphic Designer'), 'Redesigned company branding materials, maintaining brand consistency across all channels.', TRUE),
  ((SELECT id FROM job_titles WHERE title = 'Graphic Designer'), 'Collaborated with product teams to improve UI/UX, resulting in 20% higher user satisfaction.', FALSE)
ON CONFLICT DO NOTHING;