import { init3D } from './3d.js';
import { fetchGitHubContributions } from './github.js';

document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username');
  const submitButton = document.getElementById('submit-btn');

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
      fetchGitHubContributions(username)
        .then(data => {
          console.log('Contribution 데이터:', data);
          // 여기서 3D 그래프 초기화 또는 다른 처리 수행
          // init3D(data);
        })
        .catch(error => {
          alert('데이터를 가져오는 중 오류가 발생했습니다: ' + error.message);
        });
    } else {
      alert('유효한 사용자명을 입력해주세요.');
    }
  }
});
