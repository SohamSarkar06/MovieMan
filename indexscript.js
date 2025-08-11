 const firebaseConfig = {
      apiKey: "AIzaSyCNOLMoSv6MaHW9gjY7jnQBQXdoSYeckZw",
      authDomain: "movieman-98c95.firebaseapp.com",
      projectId: "movieman-98c95",
      storageBucket: "movieman-98c95.firebasestorage.app",
      messagingSenderId: "686067682473",
      appId: "1:686067682473:web:b44e3141ac3525aa48edb8"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();

    const showLoginBtn = document.getElementById("showLoginBtn");
    const showSignupBtn = document.getElementById("showSignupBtn");

    let currentView = "intro";

    function clearContent() {
      let elem;
      while ((elem = document.body.lastElementChild) && elem.id !== 'promoBanner' && elem.tagName.toLowerCase() !== 'header') {
        document.body.removeChild(elem);
      }
    }

    function appendToBody(...elements) {
      elements.forEach(el => document.body.appendChild(el));
    }

    

    function renderLoginForm() {
      clearContent();

      const main = document.createElement('main');
      main.setAttribute('role', 'main');

      const h2 = document.createElement('h2');
      h2.textContent = "Login";

      const labelEmail = document.createElement('label');
      labelEmail.htmlFor = "loginEmail";
      labelEmail.textContent = "Email";

      const inputEmail = document.createElement('input');
      inputEmail.type = "email";
      inputEmail.id = "loginEmail";
      inputEmail.placeholder = "Enter your email";
      inputEmail.required = true;

      const labelPass = document.createElement('label');
      labelPass.htmlFor = "loginPassword";
      labelPass.textContent = "Password";

      const inputPass = document.createElement('input');
      inputPass.type = "password";
      inputPass.id = "loginPassword";
      inputPass.placeholder = "Enter your password";
      inputPass.required = true;

      const btnLogin = document.createElement('button');
      btnLogin.id = "loginSubmitBtn";
      btnLogin.textContent = "Login";

      const btnForgot = document.createElement('button');
      btnForgot.id = "forgotPasswordBtn";
      btnForgot.className = "link-button";
      btnForgot.textContent = "Forgot Password?";

      const msgP = document.createElement('p');
      msgP.id = "loginMessage";
      msgP.className = "message";

      main.append(h2, labelEmail, inputEmail, labelPass, inputPass, btnLogin, btnForgot, msgP);

      document.body.appendChild(main);

      btnLogin.onclick = loginUser;
      btnForgot.onclick = forgotPassword;

      currentView = "login";
    }

    function renderSignupForm() {
      clearContent();

      const main = document.createElement('main');
      main.setAttribute('role', 'main');

      const h2 = document.createElement('h2');
      h2.textContent = "Sign Up";

      const labelEmail = document.createElement('label');
      labelEmail.htmlFor = "signupEmail";
      labelEmail.textContent = "Email";

      const inputEmail = document.createElement('input');
      inputEmail.type = "email";
      inputEmail.id = "signupEmail";
      inputEmail.placeholder = "Enter your email";
      inputEmail.required = true;

      const labelPass = document.createElement('label');
      labelPass.htmlFor = "signupPassword";
      labelPass.textContent = "Password";

      const inputPass = document.createElement('input');
      inputPass.type = "password";
      inputPass.id = "signupPassword";
      inputPass.placeholder = "Create a password";
      inputPass.required = true;

      const btnSignup = document.createElement('button');
      btnSignup.id = "signupSubmitBtn";
      btnSignup.textContent = "Sign Up";

      const msgP = document.createElement('p');
      msgP.id = "signupMessage";
      msgP.className = "message";

      main.append(h2, labelEmail, inputEmail, labelPass, inputPass, btnSignup, msgP);

      document.body.appendChild(main);

      btnSignup.onclick = signUpUser;

      currentView = "signup";
    }

    async function loginUser() {
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      const msg = document.getElementById("loginMessage");
      msg.textContent = "";
      msg.className = "message";

      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        if (user.emailVerified) {
          window.location.href = "dashboard.html";
        } else {
          msg.textContent = "Please verify your email before logging in.";
          msg.className = "message error";
          await auth.signOut();
        }
      } catch (error) {
        msg.textContent = error.message;
        msg.className = "message error";
      }
    }

    async function signUpUser() {
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value.trim();
      const msg = document.getElementById("signupMessage");
      msg.textContent = "";
      msg.className = "message";

      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        await user.sendEmailVerification();
        msg.textContent = "Verification email sent! Please check your inbox.";
        await auth.signOut();
      } catch (error) {
        msg.textContent = error.message;
        msg.className = "message error";
      }
    }

    async function forgotPassword() {
      const email = prompt("Please enter your email for password reset:");
      if (!email) return;

      try {
        await auth.sendPasswordResetEmail(email);
        alert("Password reset email sent. Please check your inbox.");
      } catch (error) {
        alert("Error: " + error.message);
      }
    }

    auth.onAuthStateChanged(user => {
      if (user && user.emailVerified) {
        if (!window.location.href.includes("dashboard.html")) {
          window.location.href = "dashboard.html";
        }
      }
    });

    showLoginBtn.onclick = () => {
      if (currentView !== "login") renderLoginForm();
    };
    showSignupBtn.onclick = () => {
      if (currentView !== "signup") renderSignupForm();
    };

    renderIntro();
