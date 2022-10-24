import React, { useState } from 'react'
import { login, register } from "../../api";

function loginText() {
    return (<><i className="bi bi-box-arrow-in-right"></i><span>Login</span></>);
}

function registerText() {
    return (<><span>Register</span></>);
}

function loadingText() {
    return (<><div className="loading"></div><span>Loading..</span></>);
}

function usernameFormat() {
    return (<>
    <b>Username Invalid:</b>
    <ul>
        <li>Must contain 3-18 characters</li>
        <li>Must contain only letters and numbers</li>
        <li>Can have underscore only between words</li>
    </ul>
    </>)
}

function passwordFormat() {
    return (<>
    <b>Password Invalid:</b>
    <ul>
        <li>Must contain 6-18 characters</li>
    </ul>
    </>)
}

const RegisterForm = ({setError, onLoginSuccessful}) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [disabled, setDisabled] = useState("");
    const [buttonText, setbuttonText] = useState(registerText);

    const onUsernameChange = (event) => setUsername(event.target.value);
    const onEmailChange = (event) => setEmail(event.target.value);
    const onPasswordChange = (event) => setPassword(event.target.value);

    function loading(show=true) {
        if(show) {
            setDisabled("disabled");
            setbuttonText(loadingText);
        }else{
            setDisabled("");
            setbuttonText(registerText);
        }
    }

    const onSubmit = async (event) => {
        event.preventDefault();
        loading();

        const registerResult = await register({ username, email, password }); 
        if(registerResult.pass) {
            setError("");
            const loginResult = await login({ username, password });
            if(loginResult.pass) {
                onLoginSuccessful();
                localStorage.setItem("token", loginResult.token);
            }
        }else{
            if(registerResult.msg === "USERNAME") {
                setError(usernameFormat);
            }else if(registerResult.msg === "PASSWORD") {
                setError(passwordFormat);
            }else{
                setError(registerResult.msg);
            }
            
        }        
        
        loading(false);
    };

  return (
    <>
        <h2>Sign Up</h2>
        <form className="sign-form" onSubmit={onSubmit}>
        <table className="form">
            <tbody>
            <tr>
                <td>Username</td>
                <td><input type="text" value={username} onChange={onUsernameChange} required /></td>
            </tr>
            <tr>
                <td>Email</td>
                <td><input type="text" value={email} onChange={onEmailChange} required /></td>
            </tr>
            <tr>
                <td>Password</td>
                <td><input type="password" value={password} onChange={onPasswordChange} required /></td>
            </tr>            
            </tbody>
        </table>
        <button disabled={disabled}>{buttonText}</button>
        </form>
    </>
  );
}

const LoginForm = ({onLoginSuccessful, setError}) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitText, setSubmitText] = useState(loginText);
    const [disabled, setDisabled] = useState("");

    const onUsernameChange = (event) => setUsername(event.target.value);
    const onPasswordChange = (event) => setPassword(event.target.value);

    function loading(show=true) {
        if(show) {
            setDisabled("disabled");
            setSubmitText(loadingText);
        }else{
            setDisabled("");
            setSubmitText(loginText);
        }
    }

    const onSubmit = async (event) => {
        event.preventDefault();
        loading();

        const loginResult = await login({ username, password });
        if(loginResult.pass) {
            setError("");
            onLoginSuccessful();
            localStorage.setItem("token", loginResult.token);
        }else{
            setError(loginResult.msg);
        }        
        
        loading(false);
    };


    return (
        <>
        <h2>Sign in</h2>
        <form className="sign-form" onSubmit={onSubmit}>
            <table className="form">
                <tbody>
                <tr><td>Username</td><td><input type="text" value={username} onChange={onUsernameChange} required /></td></tr>
                <tr><td>Password</td><td><input type="password" value={password} onChange={onPasswordChange} required /></td></tr>
                </tbody>
             </table>
             <button disabled={disabled}>{submitText}</button>
        </form>
        </>
    );
}

function Login({closeLogin, onLoginSuccessful}) {
    const [error, setError] = useState("");
    const [mode, setMode] = useState("login");

    const switchMode = (e) => {
        if(e) e.preventDefault();
        setError("");
        setMode((mode==="login") ? "register" : "login");
    }


    return (
    <>
    <div id="modal-bg" onClick={closeLogin}></div>
    <div id="signin-modal">
         <div id="modal-close" onClick={closeLogin}><i className="bi bi-x"></i></div>

    {(mode==="login") && <LoginForm onLoginSuccessful={onLoginSuccessful} setError={setError}/>}
    {(mode==="register") && <RegisterForm setError={setError} onLoginSuccessful={onLoginSuccessful} />}

    { (error !== '') && (
            <div className="error">
                {error}
            </div>
    )}

    {(mode==="login") && <p>Not a member? <a href="#" onClick={switchMode}>Sign up</a></p> }
    {(mode==="register") && <p>Already have an account? <a href="#" onClick={switchMode}>Sign in</a></p> }
    
    </div>
    </>

    );
}

export default Login;
