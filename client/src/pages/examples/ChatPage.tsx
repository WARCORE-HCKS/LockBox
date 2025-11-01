import ChatPage from "../ChatPage";
import avatar1 from "@assets/generated_images/Female_user_avatar_portrait_abd7f3c7.png";

export default function ChatPageExample() {
  const currentUser = {
    id: "me",
    name: "You",
    avatar: avatar1,
  };

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  return <ChatPage currentUser={currentUser} onLogout={handleLogout} />;
}
