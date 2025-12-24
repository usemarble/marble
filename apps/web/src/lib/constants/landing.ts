import Bounty from "../../components/icons/brand/Bounty.astro";
import Candle from "../../components/icons/brand/Candle.astro";
import Databuddy from "../../components/icons/brand/Databuddy.astro";
import Helix from "../../components/icons/brand/Helix.astro";
import Ia from "../../components/icons/brand/Ia.astro";
import Opencut from "../../components/icons/brand/Opencut.astro";

export const FEATURES = [
  {
    title: "Media Management",
    description:
      "Upload, organize, and manage all your images and files in one place.",
  },
  {
    title: "Simple Editor",
    description: "Write and format content easily with an intuitive interface.",
  },
  {
    title: "Content Intelligence",
    description: "Real-time readability scores, and optimization tips.",
  },
  {
    title: "Team Collaboration",
    description: "Work together efficiently with shared workspaces.",
  },
  {
    title: "Simple Headless API",
    description:
      "Pull content via API into any framework. Works seamlessly with Next.js, Astro, Nuxt, and more.",
    link: {
      text: "Learn how to use the API",
      href: "https://docs.marblecms.com/api/introduction",
    },
  },
  {
    title: "Realtime Webhooks",
    description:
      "Trigger external workflows instantly when your content changes. Integrate with your favorite tools.",
    link: {
      text: "Learn more about webhooks",
      href: "https://docs.marblecms.com/guides/features/webhooks",
    },
  },
];

export const USERS = [
  {
    name: "I.A",
    url: "https://independent-arts.org",
    component: Ia,
    showWordmark: true,
  },
  {
    name: "OpenCut",
    url: "https://opencut.app",
    component: Opencut,
    showWordmark: true,
  },
  {
    name: "Bounty",
    url: "https://bounty.new",
    component: Bounty,
    showWordmark: false,
  },
  {
    name: "Helix DB",
    url: "https://www.helix-db.com",
    component: Helix,
    showWordmark: true,
  },
  {
    name: "Databuddy",
    url: "https://databuddy.cc",
    component: Databuddy,
    showWordmark: true,
  },
  {
    name: "Candle",
    url: "https://www.trycandle.app/",
    component: Candle,
    showWordmark: false,
  },
];

export const REVIEWS = [
  {
    text: "The best decision I made so far building BookFlow was using @usemarblecms to manage my blogs. Super simple to integrate and offers analytics for posts",
    author: "Tech Nomad",
    role: "Developer",
    avatar: "/avatars/dauda.jpg",
    link: "https://x.com/dauda_kolo/status/1994699291365966178?s=20",
  },
  {
    text: "The @usemarblecms writing experience is pretty good. A little rough around the edges but it’s certainly a good entry in the space.",
    author: "James Perkins",
    role: "CEO, Unkey",
    avatar: "/avatars/james.jpg",
    link: "https://x.com/jamesperkins/status/1953899259515773293?s=20",
  },
  {
    text: "Marble is now great, I love the new drag and drop image feat, moving all my 3 posts to @usemarblecms 🫡",
    author: "Alex",
    role: "Developer",
    avatar: "/avatars/alex.jpg",
    link: "https://x.com/Cleverbilling/status/1957833083647885338?s=20",
  },
  {
    text: "Another W for open-source 🫡",
    author: "joshtriedcoding",
    role: "Dev Rel, Upstash",
    avatar: "/avatars/josh.jpg",
    link: "https://x.com/joshtriedcoding/status/1954973778380820688?s=20",
  },
  {
    text: "Only CMS i'll ever integrate again is @usemarblecms if needed for blogs others are just so fucking bloated nowadays and pain in the ass to integrate",
    author: "Valtteri",
    role: "Developer",
    avatar: "/avatars/valtteri.jpg",
    link: "https://x.com/vvaltterisa/status/1999549602668691822?s=20",
  },
  {
    text: "Chat, which app is this? such clean UX,",
    author: "Moinul Moin",
    role: "Developer",
    avatar: "/avatars/moinul.jpg",
    link: "https://x.com/moinulmoin/status/1964969896884011362?s=20",
  },
];
