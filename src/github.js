/**
 * Function to fetch GitHub user contribution data through the GraphQL API
 * @param {string} username GitHub username
 * @param {string} fromDate Starting date in YYYY-MM-DD format
 * @param {string} toDate Ending date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of contribution data
 */
export async function fetchGitHubContributions(username, fromDate = "2024-01-01", toDate = "2024-12-31") {
  try {
    // Note: In a production environment, you should never expose GitHub tokens on the client side.
    // This code is for demonstration purposes only.
    // In real services, tokens should be managed securely through a server-side API.
    const token = localStorage.getItem('github_token') || prompt('Enter your GitHub personal access token (only needed once):');

    if (token) {
      localStorage.setItem('github_token', token);
    } else {
      throw new Error('GitHub token is required');
    }

    // Format dates for GraphQL query
    const formattedFromDate = `${fromDate}T00:00:00Z`;
    const formattedToDate = `${toDate}T23:59:59Z`;

    // Compose GraphQL query
    const query = `{
      user(login: "${username}") {
        contributionsCollection(from: "${formattedFromDate}", to: "${formattedToDate}") {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }`;
    // Call GitHub GraphQL API
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });
    if (!response.ok) {
      throw new Error(`GitHub API response error: ${response.status}`);
    }
    const result = await response.json();

    // Check for errors
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    if (!result.data || !result.data.user) {
      throw new Error('User not found');
    }
    // Transform and return data
    const calendarData = result.data.user.contributionsCollection.contributionCalendar;
    const contributions = [];

    calendarData.weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        contributions.push({
          date: day.date,
          count: day.contributionCount,
          level: getContributionLevel(day.contributionLevel)
        });
      });
    });

    return contributions;
  } catch (error) {
    console.error('Failed to fetch contribution data:', error);
    throw error;
  }
}
/**
 * Convert GitHub contribution level string to number
 * @param {string} level - contribution level (NONE, FIRST_QUARTILE, SECOND_QUARTILE, THIRD_QUARTILE, FOURTH_QUARTILE)
 * @returns {number} Number between 0 and 4
 */
function getContributionLevel(level) {
  const levels = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4
  };

  return levels[level] || 0;
}
