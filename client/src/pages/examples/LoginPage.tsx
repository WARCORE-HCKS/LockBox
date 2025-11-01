import LoginPage from "../LoginPage";

export default function LoginPageExample() {
  const handleLogin = (username: string, password: string) => {
    console.log("Login attempt:", username, password);
  };

  return <LoginPage onLogin={handleLogin} />;
}
