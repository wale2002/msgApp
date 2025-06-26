// pages/contacts.tsx
import Contacts from "../comps/Contacts";
import TopBar from "../comps/TopBar";
import BottomBar from "../comps/BottomBar";

export default function ContactsPage() {
  return (
    <div className="contacts-page">
      <TopBar />
      <Contacts />
      <BottomBar />
    </div>
  );
}
