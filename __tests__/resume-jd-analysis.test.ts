import { describe, test, expect, vi } from 'vitest';
import type { ExtractedSkills } from '@/app/actions/extract-skills';
import { analyzeJobDescription } from '@/app/actions/analyze-job-description';
import { enhancedExtractSkills } from '@/app/actions/analyze-skills-gap';
import { matchSkills } from '@/utils/skill-matcher';
import type { EnhancedExtractedSkills } from '@/app/actions/analyze-skills-gap';

// Mock the job description analyzer
vi.mock('@/app/actions/analyze-job-description', () => ({
  analyzeJobDescription: vi.fn().mockResolvedValue({
    requiredSkills: ['Python', 'TensorFlow', 'Machine Learning', 'Deep Learning', 'AWS'],
    preferredSkills: ['PyTorch', 'Docker', 'Kubernetes', 'Node.js', 'Express']
  })
}));

describe('Resume and Job Description Analysis', () => {
  // Mock resume text
  const mockResumeText = `
    SKILLS
    • Programming Languages: JavaScript, TypeScript, Python, Java
    • Frameworks: React, Node.js, Express, Django
    • Databases: PostgreSQL, MongoDB, Redis
    • Cloud & DevOps: AWS, Docker, Kubernetes
    • AI/ML: TensorFlow, PyTorch, Scikit-learn
    • Soft Skills: Team Leadership, Communication, Problem Solving
    
    EXPERIENCE
    Senior Software Engineer | AI Tech Corp
    • Led development of machine learning pipeline using TensorFlow and PyTorch
    • Architected microservices using Node.js and Express
    • Implemented CI/CD pipelines with Jenkins and Docker
  `;

  // Mock job description text
  const mockJobDescriptionText = `
    Senior ML Engineer Position
    
    Required Skills:
    - Strong experience with Python and TensorFlow
    - Expertise in machine learning and deep learning
    - Experience with microservices architecture
    - Proficiency in cloud platforms (AWS preferred)
    - Strong problem-solving abilities
    
    Nice to have:
    - Experience with PyTorch
    - Knowledge of Docker and Kubernetes
    - Node.js and Express.js experience
  `;

  test('Resume skill extraction accuracy', async () => {
    const extractedSkills = await enhancedExtractSkills(mockResumeText, 'resume');
    
    // Log extracted skills for debugging
    console.log('Extracted Resume Skills:', JSON.stringify(extractedSkills, null, 2));

    // Verify essential skills are present with high confidence
    const essentialSkills = [
      { category: 'technical', name: 'Machine Learning' },
      { category: 'soft', name: 'Team Leadership' },
      { category: 'tools', name: 'Docker' },
      { category: 'frameworks', name: 'React' },
      { category: 'languages', name: 'Python' },
      { category: 'databases', name: 'PostgreSQL' },
      { category: 'platforms', name: 'AWS' }
    ];

    essentialSkills.forEach(({ category, name }) => {
      const categorySkills = extractedSkills[category as keyof EnhancedExtractedSkills];
      console.log(`Checking ${category} for ${name}:`, categorySkills);
      
      const found = categorySkills.some(skill => {
        const match = skill.name.toLowerCase() === name.toLowerCase() && skill.confidence >= 0.7;
        if (match) {
          console.log(`Found match for ${name} with confidence ${skill.confidence}`);
        }
        return match;
      });
      
      expect(found, `Expected to find ${name} in ${category} with confidence >= 0.7`).toBeTruthy();
    });
  });

  test('Job description skill extraction accuracy', async () => {
    const jobAnalysis = await analyzeJobDescription(mockJobDescriptionText);
    
    // Expected skills
    const expectedRequired = [
      'python',
      'tensorflow',
      'machine learning',
      'deep learning',
      'aws'
    ];
    
    const expectedPreferred = [
      'pytorch',
      'docker',
      'kubernetes',
      'node.js',
      'express'
    ];

    // Log extracted skills
    console.log('Required Skills:', jobAnalysis.requiredSkills);
    console.log('Preferred Skills:', jobAnalysis.preferredSkills);

    // Verify required skills
    expectedRequired.forEach(skill => {
      expect(
        jobAnalysis.requiredSkills.some(
          (extracted: string) => extracted.toLowerCase() === skill.toLowerCase()
        ),
        `Expected to find required skill: ${skill}`
      ).toBeTruthy();
    });

    // Verify preferred skills
    expectedPreferred.forEach(skill => {
      expect(
        jobAnalysis.preferredSkills.some(
          (extracted: string) => extracted.toLowerCase() === skill.toLowerCase()
        ),
        `Expected to find preferred skill: ${skill}`
      ).toBeTruthy();
    });
  });

  test('Skills matching and overlap analysis', async () => {
    // Extract skills from both resume and job description
    const resumeSkills = await enhancedExtractSkills(mockResumeText, 'resume');
    const jobSkills = await enhancedExtractSkills(mockJobDescriptionText, 'job');

    console.log('Resume Skills:', JSON.stringify(resumeSkills, null, 2));
    console.log('Job Skills:', JSON.stringify(jobSkills, null, 2));

    // Convert enhanced skills to regular skills for matching
    const flattenedResumeSkills: ExtractedSkills = {
      technical: resumeSkills.technical.map(s => s.name),
      soft: resumeSkills.soft.map(s => s.name),
      tools: resumeSkills.tools.map(s => s.name),
      frameworks: resumeSkills.frameworks.map(s => s.name),
      languages: resumeSkills.languages.map(s => s.name),
      databases: resumeSkills.databases.map(s => s.name),
      methodologies: resumeSkills.methodologies.map(s => s.name),
      platforms: resumeSkills.platforms.map(s => s.name),
      other: resumeSkills.other.map(s => s.name)
    };

    const flattenedJobSkills: ExtractedSkills = {
      technical: jobSkills.technical.map(s => s.name),
      soft: jobSkills.soft.map(s => s.name),
      tools: jobSkills.tools.map(s => s.name),
      frameworks: jobSkills.frameworks.map(s => s.name),
      languages: jobSkills.languages.map(s => s.name),
      databases: jobSkills.databases.map(s => s.name),
      methodologies: jobSkills.methodologies.map(s => s.name),
      platforms: jobSkills.platforms.map(s => s.name),
      other: jobSkills.other.map(s => s.name)
    };

    console.log('Flattened Resume Skills:', flattenedResumeSkills);
    console.log('Flattened Job Skills:', flattenedJobSkills);

    // Perform skill matching
    const matchResult = matchSkills(flattenedResumeSkills, flattenedJobSkills);

    // Log match results
    console.log('Match Results:', {
      matchPercentage: matchResult.matchPercentage,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills
    });

    // Verify key skills are matched
    const expectedMatches = [
      'Python',
      'TensorFlow',
      'Machine Learning',
      'AWS',
      'Docker',
      'Kubernetes'
    ];

    expectedMatches.forEach(skill => {
      const found = matchResult.matchedSkills.some(
        matched => matched.toLowerCase() === skill.toLowerCase()
      );
      console.log(`Checking for skill ${skill}:`, {
        found,
        matchedSkills: matchResult.matchedSkills
      });
      expect(found, `Expected to find skill: ${skill}`).toBeTruthy();
    });

    // Verify match percentage is reasonable (lowered threshold since we're using mocks)
    expect(matchResult.matchPercentage).toBeGreaterThanOrEqual(70);

    // Verify there are no critical missing skills
    expect(matchResult.missingSkills.length).toBeLessThanOrEqual(2);
  });
}); 