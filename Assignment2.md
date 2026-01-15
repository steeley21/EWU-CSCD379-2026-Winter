# EWU-CSCD378-2026-Winter

## Assignment 2

The purpose of this assignment is to solidify your learning of:
- Front end component development
- Using Vuetify's components
- Building a new custom component
- Creating new pages

## NEW Instructions (to be merged with others later?)

- Static site
- works on mobile and desktop (keyboard fits)
- calculate whether person wins or loses (max 6 attempts)
- follow rules for wordle NYT
- word of the day that is default on page
    - only show once, after that you should always play a different word
    - optional: have button 
- word should be random
- 2 word lists (one is shorter and modern/understandable; the other is all words that might include hard words)
- When you win, you should show definition of the word
- Keyboard with the colors on it, should always show the "best" color
- When you guess an invalid word, it shakes (or experiment with other cool ways! :))
- Keep local stats that save per browser session
- Keep track of wins/losses
- Invalid words should not be enter-able
- Count wins, losses, and average attempts (words to win)
- Create a hint generator! :D

- Extra Credit: for cool features you implement

Resources:
- Azure: https://azure.microsoft.com/en-us/free/students (You should be able to get a subscription for some resources for free (everything we use here should be free, but be careful). Reach out to Josh or Grant if you have trouble.)
    - For more peace of mind about prices, I use this pricing calculator. I'm not sure if there's an option to see what it would look like for someone on a Student Subscription, but that's something to take into mind. https://azure.microsoft.com/en-us/pricing/calculator/ 
- https://antigravity.google/
- https://docs.github.com/en/education/about-github-education/github-education-for-students/apply-to-github-education-as-a-student (I think you get Copilot for free as a student)

## (OLD) Instructions
Note: Custom CSS can only be used where specified.

1. Create a custom component to show available words ❌✅
- Create/extend a word list component with a method called validWords that returns an array of valid words based on current guesses ❌✅
- Create unit tests for the validWords method ❌✅
- Display the number of valid words based on the entered letters ❌✅
- When the number is clicked, show a dialog with all the available words with scrolling if there are too many to show on the screen. ❌✅
- When a word is clicked, the word should be entered as the guess but not submitted ❌✅
- Add a hover over for the word so it is obvious that it can be clicked. (No CSS) ❌✅

2. Convert the sidebar to an App Bar ❌✅
- Name of the app on the left with an icon ❌✅
- Choose an icon for the app (from Material Design or somewhere on the web) ❌✅
- Clicking the name and icon of the app take you to the home page ❌✅
- Hamburger menu on the right ❌✅
- Menu option for an About page ❌✅
  - Create an About page that has a few sentences about this class project and how great Meg is ❌✅
  - Make sure this has a back button ❌✅

3. Add a settings dialog ❌✅
- Add a settings selection to the App Bar's menu with a gear icon. This should open this dialog regardless of where you are on the site ❌✅
- Option for dark and light mode ❌✅
- Develop two additional color schemes (with creative names) and allow the user to change to them. Schemes should look good in both light and dark mode ❌✅
- The above two items must be implemented with built in Veutify features ❌✅

4. Style the main game page ❌✅
- Make it look like [wordle.com](https://www.nytimes.com/games/wordle/index.html) or the Wordle mobile app ❌✅
- Add gradient to guesses blocks and keys (with CSS) ❌✅
- Add drop shadow to keys (No CSS) ❌✅
- Make the app responsive (No CSS) ❌✅

5. Include a link to your Azure App in your PR comments.

## Extra Credit

- Add an appropriate sound when the UI letter buttons are clicked (5 points)
- Add creative styling following good UI/UX practices
  - Look at products by Google or some of the vuetify components for good UX/UI ideas
  - https://m2.material.io/design/guidelines-overview
