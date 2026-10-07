export function isRestaurantOpenNow() {
  const now = new Date();

  const day = now.getDay(); // 0=Sun, 1=Mon, 2=Tue...
  const hour = now.getHours();

  const openDay = 2; // Tuesday
  const closeDay = 6; // Saturday

  const isCorrectDay = day >= openDay && day <= closeDay;
  const isCorrectTime = hour >= 12 && hour < 21;

  return isCorrectDay && isCorrectTime;
}