import "./globals.css";

export const metadata = {
  title: "축구 일정 캘린더",
  description: "좋아하는 축구팀의 경기 일정을 내 캘린더에 구독하세요.",
};

export default function RootLayout({ children }) {
  return <html lang="ko"><body>{children}</body></html>;
}
