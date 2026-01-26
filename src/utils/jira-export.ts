/**
 * Jira CSV Export Utility
 * 
 * Shared function to generate Jira-compatible CSV from stories markdown.
 * Used by the automation CLI for bulk story import.
 */

/**
 * Generate a Jira-compatible CSV from stories markdown content.
 * 
 * @param storiesContent - The markdown content containing user stories
 * @param projectKey - Jira project key (e.g., "PROJ")
 * @param projectName - Project name for description
 * @returns CSV string ready for Jira import
 */
export function generateJiraCSV(
  storiesContent: string, 
  projectKey: string, 
  projectName: string
): string {
  const headers = [
    'Issue Type',
    'Summary',
    'Description',
    'Priority',
    'Story Points',
    'Labels',
  ];
  
  const rows: string[][] = [];
  
  // Parse stories from markdown (basic extraction)
  const storyPattern = /###\s+(US-\d+):\s*(.+?)(?=\n)/g;
  const matches = [...storiesContent.matchAll(storyPattern)];
  
  for (const match of matches) {
    const storyId = match[1];
    const title = match[2].trim();
    
    // Extract priority if present
    const priorityMatch = storiesContent.match(
      new RegExp(`${storyId}[\\s\\S]*?Priority:\\s*(P[012])`, 'i')
    );
    const priority = priorityMatch ? priorityMatch[1] : 'P1';
    
    // Extract story points if present
    const pointsMatch = storiesContent.match(
      new RegExp(`${storyId}[\\s\\S]*?Story Points:\\s*(\\d+)`, 'i')
    );
    const points = pointsMatch ? pointsMatch[1] : '5';
    
    // Map priority to Jira priority
    const jiraPriority = priority === 'P0' ? 'Highest' : priority === 'P1' ? 'High' : 'Medium';
    
    rows.push([
      'Story',
      `[${projectKey}] ${title}`,
      `Generated from ${projectName} documentation`,
      jiraPriority,
      points,
      'auto-generated',
    ]);
  }
  
  // If no stories were parsed, add a placeholder
  if (rows.length === 0) {
    rows.push([
      'Story',
      `[${projectKey}] Initial Setup`,
      `Review generated documentation for ${projectName}`,
      'High',
      '3',
      'auto-generated',
    ]);
  }
  
  // Build CSV with proper escaping
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  
  return csvContent;
}

/**
 * Count stories and epics from markdown content.
 * 
 * @param storiesContent - The markdown content
 * @returns Object with counts
 */
export function countStoriesAndEpics(storiesContent: string): {
  epics: number;
  stories: number;
  totalPoints: number;
} {
  const epicPattern = /## Epic:/g;
  const storyPattern = /### US-\d+:/g;
  const pointsPattern = /Points:\s*(\d+)/g;
  
  const epics = (storiesContent.match(epicPattern) || []).length;
  const stories = (storiesContent.match(storyPattern) || []).length;
  
  let totalPoints = 0;
  let pointMatch;
  while ((pointMatch = pointsPattern.exec(storiesContent)) !== null) {
    totalPoints += parseInt(pointMatch[1], 10);
  }
  
  return { epics, stories, totalPoints };
}
