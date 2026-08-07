# CODRAW

heyyy!
Thanks for checking out my little project :)

### Here is what Codraw has to offer:-

1. A working monaco editor (did I kill codespaces? jk)

2. A live preview screen that auto updates with any changes in code, either by the AI or you.

3. AI ofc! We're living in the age of AI. You can prompt it to make any type of website, and the result will be shown to you in minutes! (or seconds-- it took 2 seconds for the flash model to generate a 
functional pomodoro timer website)

4. A visual edit mode! This is the hero feature. It allows you to just drag around around any element of your website, and the code will be changed automatically based on the object's new position.

5. A diverse elements library, which allows you to delve furthur in the "visually making the site" experience. You can add any element from the vast selection of elements, and edit them using sliders and  buttons! (or prompt the AI!)

6. A website publisher! Yupp, you can publish your website for the world to see right from this one page. All you have to do is link your github, and select/create a repo to host it from!

Basically, Codraw is an end-to-end service that allows you to leave your mark on the internet. I feel making websites has been made harder than it should be, especially for non-techies. Even with AI, you have to copy the code, paste it in editors, and figure out how to get it live from there. That's fine for someone who wants to learn to code, but for someone who just wants to get it done, it is a headache. I aim to solve that problem through Codraw.

### Now some additional boring info:-

-  **Models used**:
	- **Fast**: gemini-3.1-flash-lite
	- **Balanced**: gemini-3.5-flash
	- **Deep**: gemini-3.6-flash
- **Tech Stack**:
	- **Framework**: Next.js 16 + React 19
	- **Language**: Typescript
	- **Styling**: Vanilla CSS3 + Tailwind CSS v4
	- **Code Editor**: Monaco Editor
	- **State Management**: Zustand 5 
	- **Art**: Krita (self drawn hehe)
	- **Animations and Effects**: GSAP 3.15, Tailwind micro-animations
	- **File Utilities**: JSZip + Native Web Directory Access API
	- **Icons**: Lucide React

##Setup:-

***(This is useful only if u want to run an instance of codraw yourself; if you simply wish to try it check out https://codraw.agm.quest)***

1. **Clone the repository**:

	```bash
   git clone https://github.com/Aditya-Gamer011/Codraw
   cd <ur-location>/codraw/apps/web
	```

2. **Install dependencies**:
	```bash
	npm install
	```
3. **Configure Environment Variables**:

	**Google Gemini API Key (get one from https://aistudio.google.com)**
	```bash
	GEMINI_API_KEY=your_gemini_api_key_here
	```

	**GitHub OAuth App Credentials (Optional for GitHub integration)**
	```bash
	GITHUB_CLIENT_ID=your_github_client_id
	GITHUB_CLIENT_SECRET=your_github_client_secret
	GITHUB_CALLBACK_URL=http://localhost:3000/api/github/callback
	```

4. **Run the server**:
	```bash
	npm run dev
	```

anddd you're set!
I hope you enjoy :)

	










