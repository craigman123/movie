document.addEventListener("DOMContentLoaded", function() {
    const loginContainer = document.querySelector(".login-container");
    const registerContainer = document.querySelector(".register-container");

    const showRegisterBtn = document.getElementById("showRegister");
    const showLoginBtn = document.getElementById("showLogin");
    const showForgotPasswordBtn = document.getElementById("showForgotPassword");

    const forgotPasswordModal = document.getElementById("forgotPasswordModal");
    const forgotPasswordBackdrop = document.getElementById("forgotPasswordBackdrop");
    const hideForgotPasswordBtn = document.getElementById("hideForgotPassword");
    const forgotEmailForm = document.getElementById("forgotEmailForm");
    const forgotEmailInput = document.getElementById("forgotEmailInput");
    const forgotEmailStatus = document.getElementById("forgotEmailStatus");

    const phoneConfirmModal = document.getElementById("phoneConfirmModal");
    const phoneConfirmBackdrop = document.getElementById("phoneConfirmBackdrop");
    const hidePhoneConfirmBtn = document.getElementById("hidePhoneConfirm");
    const cancelPhoneConfirmBtn = document.getElementById("cancelPhoneConfirm");
    const phoneConfirmCopy = document.getElementById("phoneConfirmCopy");
    const phoneConfirmStatus = document.getElementById("phoneConfirmStatus");
    const verifyPinForm = document.getElementById("verifyPinForm");
    const verifyPinInput = document.getElementById("verifyPinInput");

    const changePasswordModal = document.getElementById("changePasswordModal");
    const changePasswordBackdrop = document.getElementById("changePasswordBackdrop");
    const hideChangePasswordBtn = document.getElementById("hideChangePassword");
    const changePasswordForm = document.getElementById("changePasswordForm");
    const changePasswordStatus = document.getElementById("changePasswordStatus");
    const changePasswordInput = document.getElementById("changePasswordInput");
    const confirmPasswordInput = document.getElementById("confirmPasswordInput");
    const googleLoginButton = document.getElementById("googleLoginButton");
    const googleRegisterButton = document.getElementById("googleRegisterButton");
    const googleStatusLogin = document.getElementById("googleStatusLogin");
    const googleStatusRegister = document.getElementById("googleStatusRegister");

    let currentResetToken = "";
    let googleInitialized = false;

    function setModalVisible(modal, isVisible) {
        if (!modal) return;
        modal.classList.toggle("hidden", !isVisible);

        const anyOpen = [forgotPasswordModal, phoneConfirmModal, changePasswordModal]
            .some((item) => item && !item.classList.contains("hidden"));

        document.body.classList.toggle("modal-open", anyOpen);
    }

    function closeAllResetModals() {
        setModalVisible(forgotPasswordModal, false);
        setModalVisible(phoneConfirmModal, false);
        setModalVisible(changePasswordModal, false);
    }

    function showStatus(element, message, isError) {
        if (!element) return;
        element.textContent = message;
        element.classList.remove("hidden", "is-error", "is-success");
        element.classList.add(isError ? "is-error" : "is-success");
    }

    function clearStatus(element) {
        if (!element) return;
        element.textContent = "";
        element.classList.add("hidden");
        element.classList.remove("is-error", "is-success");
    }

    function showGoogleStatus(message, isError) {
        [googleStatusLogin, googleStatusRegister].forEach(function(element) {
            if (!element) return;
            element.textContent = message;
            element.classList.remove("hidden", "is-error", "is-success");
            element.classList.add(isError ? "is-error" : "is-success");
        });
    }

    function clearGoogleStatus() {
        [googleStatusLogin, googleStatusRegister].forEach(function(element) {
            if (!element) return;
            element.textContent = "";
            element.classList.add("hidden");
            element.classList.remove("is-error", "is-success");
        });
    }

    async function handleGoogleCredential(response) {
        clearGoogleStatus();

        try {
            const authResponse = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential })
            });

            const data = await authResponse.json();
            if (!authResponse.ok || !data.ok) {
                showGoogleStatus(data.message || "Google sign-in failed.", true);
                return;
            }

            window.location.href = data.redirect_url || "/dashboard";
        } catch (error) {
            showGoogleStatus("Network error during Google sign-in.", true);
        }
    }

    function initializeGoogleButtons() {
        if (googleInitialized) return;
        if (!window.GOOGLE_CLIENT_ID) {
            showGoogleStatus("Google sign-in is not configured yet.", true);
            return;
        }
        if (!window.google || !window.google.accounts || !window.google.accounts.id) {
            return;
        }

        window.google.accounts.id.initialize({
            client_id: window.GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential
        });

        [googleLoginButton, googleRegisterButton].forEach(function(element) {
            if (!element) return;
            element.innerHTML = "";
            window.google.accounts.id.renderButton(element, {
                theme: "outline",
                size: "large",
                type: "standard",
                text: "continue_with",
                shape: "pill",
                width: 300
            });
        });

        googleInitialized = true;
        clearGoogleStatus();
    }

    window.initializeGoogleLogin = initializeGoogleButtons;

    showRegisterBtn?.addEventListener("click", function() {
        loginContainer?.classList.add("hidden");
        registerContainer?.classList.remove("hidden");
        closeAllResetModals();
    });

    showLoginBtn?.addEventListener("click", function() {
        registerContainer?.classList.add("hidden");
        loginContainer?.classList.remove("hidden");
    });

    showForgotPasswordBtn?.addEventListener("click", function() {
        forgotEmailForm?.reset();
        verifyPinForm?.reset();
        clearStatus(forgotEmailStatus);
        clearStatus(phoneConfirmStatus);
        clearStatus(changePasswordStatus);
        currentResetToken = "";
        closeAllResetModals();
        setModalVisible(forgotPasswordModal, true);
        forgotEmailInput?.focus();
    });

    hideForgotPasswordBtn?.addEventListener("click", closeAllResetModals);
    hidePhoneConfirmBtn?.addEventListener("click", closeAllResetModals);
    cancelPhoneConfirmBtn?.addEventListener("click", closeAllResetModals);
    hideChangePasswordBtn?.addEventListener("click", closeAllResetModals);

    forgotPasswordBackdrop?.addEventListener("click", closeAllResetModals);
    phoneConfirmBackdrop?.addEventListener("click", closeAllResetModals);
    changePasswordBackdrop?.addEventListener("click", closeAllResetModals);

    forgotEmailForm?.addEventListener("submit", async function(event) {
        event.preventDefault();
        clearStatus(forgotEmailStatus);

        const email = forgotEmailInput?.value.trim() || "";
        if (!email) {
            showStatus(forgotEmailStatus, "Enter your email address first.", true);
            return;
        }

        try {
            const response = await fetch("/api/forgot-password/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();
            if (!response.ok || !data.ok) {
                showStatus(forgotEmailStatus, data.message || "Could not start reset flow.", true);
                return;
            }

            currentResetToken = data.reset_token || "";
            phoneConfirmCopy.textContent = "We sent a 6-digit PIN to your email. Enter it below to continue.";
            verifyPinForm?.reset();
            clearStatus(phoneConfirmStatus);
            setModalVisible(forgotPasswordModal, false);
            setModalVisible(phoneConfirmModal, true);
            verifyPinInput?.focus();
        } catch (error) {
            showStatus(forgotEmailStatus, "Network error. Please try again.", true);
        }
    });

    verifyPinInput?.addEventListener("input", function() {
        this.value = this.value.replace(/\D/g, "").slice(0, 6);
    });

    verifyPinForm?.addEventListener("submit", async function(event) {
        event.preventDefault();
        clearStatus(phoneConfirmStatus);

        const pin = verifyPinInput?.value.trim() || "";
        if (pin.length !== 6) {
            showStatus(phoneConfirmStatus, "Enter the full 6-digit PIN from your email.", true);
            return;
        }

        try {
            const response = await fetch("/api/forgot-password/verify-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reset_token: currentResetToken,
                    pin: pin
                })
            });

            const data = await response.json();
            if (!response.ok || !data.ok) {
                showStatus(phoneConfirmStatus, data.message || "PIN verification failed.", true);
                return;
            }

            changePasswordForm?.reset();
            clearStatus(changePasswordStatus);
            setModalVisible(phoneConfirmModal, false);
            setModalVisible(changePasswordModal, true);
            changePasswordInput?.focus();
        } catch (error) {
            showStatus(phoneConfirmStatus, "Network error. Please try again.", true);
        }
    });

    changePasswordForm?.addEventListener("submit", async function(event) {
        event.preventDefault();
        clearStatus(changePasswordStatus);

        const password = changePasswordInput?.value || "";
        const confirmPassword = confirmPasswordInput?.value || "";

        try {
            const response = await fetch("/api/forgot-password/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reset_token: currentResetToken,
                    password: password,
                    confirm_password: confirmPassword
                })
            });

            const data = await response.json();
            if (!response.ok || !data.ok) {
                showStatus(changePasswordStatus, data.message || "Password update failed.", true);
                return;
            }

            showStatus(changePasswordStatus, data.message || "Password updated.", false);
            window.setTimeout(function() {
                closeAllResetModals();
                currentResetToken = "";
            }, 1200);
        } catch (error) {
            showStatus(changePasswordStatus, "Network error. Please try again.", true);
        }
    });

    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            closeAllResetModals();
        }
    });

    initializeGoogleButtons();
});

document.addEventListener('DOMContentLoaded', function () {
    const verifyBtn = document.getElementById('emailVerifySubmit');
    if (!verifyBtn) return;

    verifyBtn.addEventListener('click', async function () {
        const pin = document.getElementById('emailVerifyPinInput').value.trim();
        const status = document.getElementById('emailVerifyStatus');

        if (pin.length !== 6) {
            status.textContent = 'Please enter the full 6-digit PIN.';
            status.classList.remove('hidden');
            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Verifying...';

        try {
            const res = await fetch('/api/verify-registration-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const data = await res.json();

            if (data.ok) {
                window.location.href = data.redirect_url;
            } else {
                status.textContent = data.message || 'Invalid PIN.';
                status.classList.remove('hidden');
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'VERIFY';
            }
        } catch {
            status.textContent = 'Something went wrong. Try again.';
            status.classList.remove('hidden');
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'VERIFY';
        }
    });
});
