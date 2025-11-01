import MessageBubble from "../MessageBubble";
import avatar1 from "@assets/generated_images/Female_user_avatar_portrait_abd7f3c7.png";

export default function MessageBubbleExample() {
  const now = new Date();
  const earlier = new Date(now.getTime() - 5 * 60000);

  return (
    <div className="max-w-3xl bg-background p-6 space-y-4">
      <MessageBubble
        id="1"
        content="Hey! How are you doing?"
        sender={{ name: "Sarah Johnson", avatar: avatar1 }}
        timestamp={earlier}
        isOwn={false}
        showAvatar={true}
      />
      <MessageBubble
        id="2"
        content="I'm doing great! Just finished that project we talked about."
        sender={{ name: "You" }}
        timestamp={now}
        isOwn={true}
      />
      <MessageBubble
        id="3"
        content="That's awesome! Would love to hear more about it."
        sender={{ name: "Sarah Johnson", avatar: avatar1 }}
        timestamp={now}
        isOwn={false}
        showAvatar={false}
      />
    </div>
  );
}
