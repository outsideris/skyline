/**
 * GitHub 사용자의 contribution 데이터를 GraphQL API를 통해 가져오는 함수
 * @param {string} username GitHub 사용자 이름
 * @returns {Promise<Array>} contribution 데이터 배열
 */
export async function fetchGitHubContributions(username) {
  try {
    // 주의: 실제 프로덕션 환경에서는 GitHub 토큰을 클라이언트에 노출하면 안 됩니다.
    // 이 코드는 데모 목적으로만 사용하세요.
    // 실제 서비스에서는 서버측 API를 통해 토큰을 안전하게 관리해야 합니다.
    const token = localStorage.getItem('github_token') || prompt('GitHub 개인 액세스 토큰을 입력해주세요 (처음 한 번만 필요):');
    
    if (token) {
      localStorage.setItem('github_token', token);
    } else {
      throw new Error('GitHub 토큰이 필요합니다');
    }

    // The total time spanned by 'from' and 'to' must not exceed 1 year
    const fromDate = "2024-01-01T00:00:00Z";
    const toDate = "2024-12-31T23:59:59Z";
    
    // GraphQL 쿼리 구성
    const query = `{
      user(login: "${username}") {
        contributionsCollection(from: "${fromDate}", to: "${toDate}") {
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

    // GitHub GraphQL API 호출
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`GitHub API 응답 오류: ${response.status}`);
    }

    const result = await response.json();
    
    // 오류 확인
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    if (!result.data || !result.data.user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    // 데이터 변환 및 반환
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
    console.error('Contribution 데이터 가져오기 실패:', error);
    throw error;
  }
}

/**
 * GitHub의 contribution level 문자열을 숫자로 변환
 * @param {string} level - contribution level (NONE, FIRST_QUARTILE, SECOND_QUARTILE, THIRD_QUARTILE, FOURTH_QUARTILE)
 * @returns {number} 0에서 4 사이의 숫자
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
