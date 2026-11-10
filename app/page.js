import AccountNav from "./components/account-nav.js";
import CalendarSearch from "./components/calendar-search.js";

export const dynamic = "force-dynamic";

export default function Home() {
  return <main><AccountNav /><CalendarSearch /></main>;
}
