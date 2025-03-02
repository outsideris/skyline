import { init3D } from './3d.js';

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
      // 여기에 username으로 다음 작업을 수행하는 코드 추가
      // 예: 다른 페이지로 이동하거나 GitHub API 호출 등
    } else {
      alert('유효한 사용자명을 입력해주세요.');
    }
  }
});
