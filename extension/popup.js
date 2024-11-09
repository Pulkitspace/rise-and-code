document.addEventListener('DOMContentLoaded', async function() {

  // Function to set or get username
  function setUsername() {
    chrome.storage.local.get('username', function(result) {
        let username = result.username;

        if (!username) {
            username = window.prompt("Please enter your name:");
            if (username) {
                chrome.storage.local.set({ username: username });
            } else {
                username = "User"; // Default name if nothing is provided
            }
        }

        const usernameElement = document.getElementById('username');
        usernameElement.textContent = `Welcome, ${username}`;
    });
  }

  // Function to fetch questions from the static JSON file
  async function fetchQuestions() {
      try {
          const response = await fetch('questions.json');
          const data = await response.json();
          return data;
      } catch (error) {
          console.error('Error fetching questions:', error);
          return {
              codingQuestions: [{ "question": "❌ Error loading coding questions.", "link": "#" }],
              osQuestions: [{ "question": "❌ Error loading OS questions.", "link": "#" }],
              networkQuestions: [{ "question": "❌ Error loading Network questions.", "link": "#" }],
              dbmsQuestions: [{ "question": "❌ Error loading DBMS questions.", "link": "#" }],
              sqlQuestions: [{ "question": "❌ Error loading SQL questions.", "link": "#" }]
          };
      }
  }

  // Function to get a random item from an array
  function getRandomItem(array) {
      return array[Math.floor(Math.random() * array.length)];
  }

  // Fetch the Hindi chapter summary from the Bhagavad Gita API
  async function fetchHindiChapterSummary() {
      const url = 'https://bhagavad-gita3.p.rapidapi.com/v2/chapters/?skip=0&limit=18';
      const options = {
          method: 'GET',
          headers: {
              'x-rapidapi-key': '3e6036ba92msh7c8692b525bf44bp1a562ajsn90eda2a522c6',
              'x-rapidapi-host': 'bhagavad-gita3.p.rapidapi.com'
          }
      };

      try {
          const response = await fetch(url, options);
          const data = await response.json();
          const chapter = getRandomItem(data); // Choose a random chapter
          return chapter.chapter_summary_hindi; // Fetch the Hindi chapter summary
      } catch (error) {
          console.error('Error fetching chapter summary:', error);
          return "अध्याय सारांश प्राप्त करने में त्रुटि।";
      }
  }

  // Set the content for Bhagavad Gita summary
  async function setShloka() {
      let hindiSummary;
      // Check if there's already saved shloka data
      chrome.storage.local.get('shloka', async function(result) {
          if (result.shloka) {
              hindiSummary = result.shloka;
          } else {
              hindiSummary = await fetchHindiChapterSummary();
              chrome.storage.local.set({ 'shloka': hindiSummary });
          }

          const shlokaElement = document.getElementById('shloka');
          const seeMoreButton = document.getElementById('see-more');

          // Initially display only a small part of the summary
          if (hindiSummary.length > 100) {
              shlokaElement.textContent = hindiSummary.substring(0, 100) + "...";
              seeMoreButton.classList.remove('hidden');
          } else {
              shlokaElement.textContent = hindiSummary;
          }

          // Event listener to expand the summary
          seeMoreButton.addEventListener('click', () => {
              shlokaElement.textContent = hindiSummary;
              seeMoreButton.style.display = 'none';
          });
      });
  }

  // Fetch and set the content for technical questions
  async function setQuestions() {
      let questions;
      // Check if there's already saved questions data
      chrome.storage.local.get(['codingQuestion', 'osQuestion', 'networkQuestion', 'dbmsQuestion', 'sqlQuestion'], async function(result) {
          if (result.codingQuestion && result.osQuestion && result.networkQuestion && result.dbmsQuestion && result.sqlQuestion) {
              questions = {
                  codingQuestion: result.codingQuestion,
                  osQuestion: result.osQuestion,
                  networkQuestion: result.networkQuestion,
                  dbmsQuestion: result.dbmsQuestion,
                  sqlQuestion: result.sqlQuestion
              };
          } else {
              const fetchedQuestions = await fetchQuestions();
              questions = {
                  codingQuestion: getRandomItem(fetchedQuestions.codingQuestions),
                  osQuestion: getRandomItem(fetchedQuestions.osQuestions),
                  networkQuestion: getRandomItem(fetchedQuestions.networkQuestions),
                  dbmsQuestion: getRandomItem(fetchedQuestions.dbmsQuestions),
                  sqlQuestion: getRandomItem(fetchedQuestions.sqlQuestions)
              };
              chrome.storage.local.set(questions);
          }

          document.getElementById('coding-question').textContent = questions.codingQuestion.question;
          document.getElementById('os-question').textContent = questions.osQuestion.question;
          document.getElementById('network-question').textContent = questions.networkQuestion.question;
          document.getElementById('dbms-question').textContent = questions.dbmsQuestion.question;
          document.getElementById('sql-question').textContent = questions.sqlQuestion.question;

          // Set button actions
          document.getElementById('coding-link-btn').addEventListener('click', () => {
              window.open(questions.codingQuestion.link, '_blank');
          });
          document.getElementById('os-link-btn').addEventListener('click', () => {
              window.open(questions.osQuestion.link, '_blank');
          });
          document.getElementById('network-link-btn').addEventListener('click', () => {
              window.open(questions.networkQuestion.link, '_blank');
          });
          document.getElementById('dbms-link-btn').addEventListener('click', () => {
              window.open(questions.dbmsQuestion.link, '_blank');
          });
          document.getElementById('sql-link-btn').addEventListener('click', () => {
              window.open(questions.sqlQuestion.link, '_blank');
          });
      });
  }

  // Handle reset button click
  document.getElementById('reset-btn').addEventListener('click', function() {
      // Clear all stored data
      chrome.storage.local.clear(function() {
          // Regenerate and display new questions and shloka
          setShloka();
          setQuestions();
      });
  });

  // Function to update the daily streak
  function updateDailyStreak() {
      const today = new Date().toLocaleDateString();
      
      chrome.storage.local.get({ lastInteraction: null, streakCount: 0 }, function(result) {
          const lastInteraction = result.lastInteraction;
          let streakCount = result.streakCount;

          if (lastInteraction === today) {
              // User has already interacted today; no update to the streak
              console.log("User has already interacted today.");
          } else {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);

              if (lastInteraction === yesterday.toLocaleDateString()) {
                  // Continue the streak
                  streakCount += 1;
              } else {
                  // Reset the streak
                  streakCount = 1;
              }

              // Update the storage with the new streak and date
              chrome.storage.local.set({ lastInteraction: today, streakCount: streakCount }, function() {
                  console.log("Streak updated:", streakCount);
                  displayStreak(streakCount);
              });
          }
      });
  }

  // Function to display the streak
  function displayStreak(streakCount) {
      const streakElement = document.getElementById('streak');
      streakElement.textContent = `🔥 Current Streak: ${streakCount} day(s)`;
  }

  function setTheme(mode) {
    const body = document.body;
    const shlokaContainer = document.getElementById('shloka-container');
    const questionsContainer = document.getElementById('questions-container');
    const buttons = document.querySelectorAll('button');
    const headings = document.querySelectorAll('#questions-container h3');
    const seeMoreButton = document.getElementById('see-more');
    const modeLabel = document.getElementById('mode-label');
    const shlokaElement = document.getElementById('shloka');

    // Clear previous classes
    body.classList.remove('light-mode', 'dark-mode');
    shlokaContainer.classList.remove('light-mode', 'dark-mode');
    questionsContainer.classList.remove('light-mode', 'dark-mode');
    buttons.forEach(button => button.classList.remove('light-mode', 'dark-mode'));
    seeMoreButton.classList.remove('light-mode', 'dark-mode');
    headings.forEach(heading => heading.classList.remove('light-mode', 'dark-mode'));

    // Apply new mode
    body.classList.add(`${mode}-mode`);
    shlokaContainer.classList.add(`${mode}-mode`);
    questionsContainer.classList.add(`${mode}-mode`);
    buttons.forEach(button => button.classList.add(`${mode}-mode`));
    seeMoreButton.classList.add(`${mode}-mode`);
    headings.forEach(heading => heading.classList.add(`${mode}-mode`));

    if (mode === 'light') {
        shlokaElement.style.color = '#ffffff'; // White color for shloka text in light mode
        modeLabel.textContent = 'Light Mode';
    } else {
        shlokaElement.style.color = ''; // Reset to default color (from CSS)
        headings.forEach(heading => heading.style.color = '#bb86fc'); // Lighter color for headings in dark mode
        modeLabel.textContent = 'Dark Mode';
    }
  }

  // Load user preference for theme
  chrome.storage.local.get('theme', function(result) {
      const mode = result.theme || 'light';
      document.getElementById('mode-toggle').checked = (mode === 'dark');
      setTheme(mode);
  });

  // Toggle theme on switch change
  document.getElementById('mode-toggle').addEventListener('change', function() {
      const mode = this.checked ? 'dark' : 'light';
      chrome.storage.local.set({ theme: mode });
      setTheme(mode);
  });

  // Initialize the streak tracking when the popup is opened
  setUsername();
  updateDailyStreak();

  // Initialize the popup
  setShloka();
  setQuestions();
});
