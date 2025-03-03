import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchGitHubContributions } from './github.js';

// Mock implementation of getContributionLevel since it's a private function
function mockGetContributionLevel(level) {
  const levels = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4
  };
  
  return levels[level] || 0;
}

// Mock values for testing
const mockUsername = 'testuser';
const mockToken = 'mock_token';
const mockSuccessResponse = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 100,
          weeks: [
            {
              contributionDays: [
                { date: '2024-01-01', contributionCount: 5, contributionLevel: 'SECOND_QUARTILE' },
                { date: '2024-01-02', contributionCount: 10, contributionLevel: 'FOURTH_QUARTILE' }
              ]
            },
            {
              contributionDays: [
                { date: '2024-01-08', contributionCount: 0, contributionLevel: 'NONE' },
                { date: '2024-01-09', contributionCount: 3, contributionLevel: 'FIRST_QUARTILE' }
              ]
            }
          ]
        }
      }
    }
  }
};

const mockErrorResponse = {
  errors: [{ message: 'API rate limit exceeded' }]
};

const mockUserNotFoundResponse = {
  data: {}
};

describe('GitHub API', () => {
  // Create mocks for localStorage, fetch and other browser APIs
  let originalLocalStorage;
  let originalFetch;
  let originalConsoleError;

  beforeEach(() => {
    // Mock localStorage
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn()
    };

    // Mock fetch
    originalFetch = global.fetch;
    global.fetch = vi.fn();

    // Mock console.error
    originalConsoleError = console.error;
    console.error = vi.fn();

    // Mock window.prompt (if needed)
    global.prompt = vi.fn().mockImplementation(() => mockToken);
  });

  afterEach(() => {
    // Restore original implementations
    global.localStorage = originalLocalStorage;
    global.fetch = originalFetch;
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  describe('fetchGitHubContributions', () => {
    it('should fetch and transform GitHub contribution data successfully', async () => {
      // Arrange
      global.localStorage.getItem.mockReturnValue(mockToken);
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse
      });

      // Act
      const result = await fetchGitHubContributions(mockUsername);

      // Assert
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        },
        body: expect.any(String)
      });

      // Check correct data transformation
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        count: 5,
        level: 2 // SECOND_QUARTILE
      });
      expect(result[1]).toEqual({
        date: '2024-01-02',
        count: 10,
        level: 4 // FOURTH_QUARTILE
      });
    });

    it('should prompt for token if not stored in localStorage', async () => {
      // Arrange
      global.localStorage.getItem.mockReturnValue(null);
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse
      });

      // Act
      await fetchGitHubContributions(mockUsername);

      // Assert
      expect(prompt).toHaveBeenCalledWith('Enter your GitHub personal access token (only needed once):');
      expect(localStorage.setItem).toHaveBeenCalledWith('github_token', mockToken);
    });

    it('should throw an error if API request fails', async () => {
      // Arrange
      global.localStorage.getItem.mockReturnValue(mockToken);
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401
      });

      // Act & Assert
      await expect(fetchGitHubContributions(mockUsername))
        .rejects
        .toThrow('GitHub API response error: 401');
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should throw an error if API returns errors', async () => {
      // Arrange
      global.localStorage.getItem.mockReturnValue(mockToken);
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockErrorResponse
      });

      // Act & Assert
      await expect(fetchGitHubContributions(mockUsername))
        .rejects
        .toThrow('API rate limit exceeded');
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should throw an error if user not found', async () => {
      // Arrange
      global.localStorage.getItem.mockReturnValue(mockToken);
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockUserNotFoundResponse
      });

      // Act & Assert
      await expect(fetchGitHubContributions(mockUsername))
        .rejects
        .toThrow('User not found');
      
      expect(console.error).toHaveBeenCalled();
    });

    it('should throw an error if no token is provided', async () => {
      // Arrange
      global.localStorage.getItem.mockReturnValue(null);
      global.prompt.mockReturnValue(null);

      // Act & Assert
      await expect(fetchGitHubContributions(mockUsername))
        .rejects
        .toThrow('GitHub token is required');
      
      expect(console.error).toHaveBeenCalled();
    });
  });
});