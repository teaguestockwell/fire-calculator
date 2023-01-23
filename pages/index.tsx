import dynamic from "next/dynamic";

const Page = dynamic(() => import("../lib/index"), {
  ssr: false,
});

export default Page;
