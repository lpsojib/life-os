"use client";

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* About Image */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <img
          src="/about-life-os.jpg"
          alt="Life OS"
          className="h-56 w-full object-cover sm:h-72 md:h-96"
        />
      </div>

      {/* Content */}
      <div className="mt-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Life OS সম্পর্কে
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
          Life OS হলো আপনার দৈনন্দিন জীবনকে আরও সুন্দর, গোছানো এবং
          কার্যকরভাবে পরিচালনা করার একটি personal productivity system।
        </p>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
          এখানে আপনি Tasks, Habits, Goals, Journal, Focus, Finance,
          Reminder এবং AI-এর মতো বিভিন্ন ফিচার ব্যবহার করে আপনার
          গুরুত্বপূর্ণ কাজ ও লক্ষ্যগুলো এক জায়গা থেকে পরিচালনা করতে পারবেন।
        </p>

        {/* Features */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Tasks
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              প্রতিদিনের গুরুত্বপূর্ণ কাজগুলো সহজে পরিচালনা করুন।
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Habits
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              ভালো অভ্যাস তৈরি করুন এবং নিয়মিত অগ্রগতি ধরে রাখুন।
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Goals
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              বড় লক্ষ্যকে ছোট ছোট ধাপে ভাগ করে এগিয়ে যান।
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Journal
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              আপনার চিন্তা, অভিজ্ঞতা এবং গুরুত্বপূর্ণ বিষয়গুলো লিখে রাখুন।
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Focus
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              মনোযোগ দিয়ে কাজ করার জন্য আপনার সময়কে আরও ভালোভাবে ব্যবহার করুন।
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">
              Reminder
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              গুরুত্বপূর্ণ বিষয় ও কাজের কথা সময়মতো মনে রাখুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}