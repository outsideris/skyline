import { init3D } from './3d.js';
import { fetchGitHubContributions } from './github.js';

document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username');
  const submitButton = document.getElementById('submit-btn');
  const visualContainer = document.getElementById('visualization-container');

  // Enter 키 누르면 제출
  usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  });

  // 버튼 클릭 시 제출
  submitButton.addEventListener('click', handleSubmit);

  function handleSubmit() {
    const username = usernameInput.value.trim();
    if (username) {
      console.log(`GitHub username: ${username}`);

      // Clear previous content in visualization container
      visualContainer.innerHTML = '';
      visualContainer.classList.add('hidden');

      // Show loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'loading';
      loadingDiv.className = 'loading loading-spinner loading-lg text-primary my-8 mx-auto block';
      document.getElementById('app').appendChild(loadingDiv);

      fetchGitHubContributions(username)
        .then(data => {
          console.log('Contribution 데이터:', data);

          // Remove loading indicator
          const loadingEl = document.getElementById('loading');
          if (loadingEl) loadingEl.remove();

          // Show visualization container
          visualContainer.classList.remove('hidden');

          // Add user info header
          const userHeader = document.createElement('div');
          userHeader.className = 'text-xl font-semibold mb-2 p-4 bg-base-200 rounded-t-lg';
          userHeader.textContent = `${username}'s GitHub Contribution Skyline (2024)`;
          visualContainer.appendChild(userHeader);

          // Add stats info
          const totalContributions = data.reduce((sum, item) => sum + item.count, 0);
          const statsDiv = document.createElement('div');
          statsDiv.className = 'text-sm p-2 bg-base-100 border-b';
          statsDiv.textContent = `Total Contributions: ${totalContributions}`;
          visualContainer.appendChild(statsDiv);

          // Create a container for the 3D canvas
          const canvasContainer = document.createElement('div');
          canvasContainer.id = '3d-canvas';
          canvasContainer.className = 'w-full h-[500px]';
          visualContainer.appendChild(canvasContainer);

          // Initialize 3D visualization with contribution data
          init3D(data);

          // Add instruction text
          const infoText = document.createElement('div');
          infoText.className = 'text-sm text-gray-600 p-3 bg-base-100 rounded-b-lg';
          infoText.textContent = 'Drag to rotate, scroll to zoom';
          visualContainer.appendChild(infoText);
        })
        .catch(error => {
          // Remove loading indicator
          const loadingEl = document.getElementById('loading');
          if (loadingEl) loadingEl.remove();

          // Show error message
          const errorDiv = document.createElement('div');
          errorDiv.className = 'alert alert-error mt-4';
          errorDiv.textContent = '데이터를 가져오는 중 오류가 발생했습니다: ' + error.message;
          document.getElementById('app').appendChild(errorDiv);
        });
    } else {
      alert('유효한 사용자명을 입력해주세요.');
    }
  }
});
