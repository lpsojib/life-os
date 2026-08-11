"use client";

import Image from "next/image";
import aboutImage from "./lp-sojib.jpeg";

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* =========================
          Profile Image
          ========================= */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <Image
          src={aboutImage}
          alt="LP Sojib - Web Developer"
          className="h-64 w-full object-cover sm:h-80 md:h-[420px]"
          priority
        />
      </div>

      {/* =========================
          About Content
          ========================= */}
      <div className="mt-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          About Me
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          LP Sojib
        </h1>

        <p className="mt-2 text-lg font-medium text-gray-500">
          Web Developer
        </p>

        <div className="mx-auto mt-6 max-w-2xl space-y-4 text-base leading-8 text-gray-600 sm:text-lg">
          <p>
            আমি LP Sojib। আমি একজন Web Developer এবং Life OS-এর
            নির্মাতা। আমার লক্ষ্য হলো প্রযুক্তিকে ব্যবহার করে
            দৈনন্দিন জীবনকে আরও সহজ, গোছানো এবং productive করে তোলা।
          </p>

          <p>
            আমরা প্রতিদিন অনেক কাজ করি, নতুন নতুন লক্ষ্য তৈরি করি,
            ভালো অভ্যাস গড়ার চেষ্টা করি এবং গুরুত্বপূর্ণ বিষয়গুলো
            মনে রাখার চেষ্টা করি। কিন্তু সবকিছু আলাদা আলাদাভাবে
            পরিচালনা করা অনেক সময় কঠিন হয়ে যায়।
          </p>
        </div>
      </div>

      {/* =========================
          Why Life OS
          ========================= */}
      <section className="mt-12 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600">
            Why Life OS?
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            আমাদের Life OS কেন দরকার?
          </h2>
        </div>

        <div className="mx-auto mt-6 max-w-3xl space-y-4 text-base leading-8 text-gray-600">
          <p>
            Life OS তৈরি করার মূল উদ্দেশ্য হলো জীবনের গুরুত্বপূর্ণ
            বিষয়গুলোকে একটি জায়গায় নিয়ে আসা। Tasks, Habits, Goals,
            Journal, Focus, Finance, Reminder এবং AI—সবকিছু যেন
            সহজে পরিচালনা করা যায়।
          </p>

          <p>
            একটি ভালো system আমাদের শুধু কাজ মনে রাখতে সাহায্য করে
            না; বরং কোন কাজটি গুরুত্বপূর্ণ, কোন লক্ষ্য নিয়ে আমরা
            এগোচ্ছি এবং আমাদের দৈনন্দিন অগ্রগতি কেমন হচ্ছে—সেটাও
            বুঝতে সাহায্য করে।
          </p>

          <p>
            Life OS-এর মাধ্যমে আমি এমন একটি personal system তৈরি
            করতে চাই, যেখানে একজন মানুষ তার নিজের জীবনকে নিজের
            মতো করে organize এবং manage করতে পারে।
          </p>
        </div>
      </section>

      {/* =========================
          Life OS Features
          ========================= */}
      <section className="mt-8">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Life OS-এ কী আছে?
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            title="Tasks"
            text="দৈনন্দিন এবং ভবিষ্যতের কাজগুলো সহজে পরিচালনা করুন।"
          />

          <Feature
            title="Habits"
            text="নতুন ভালো অভ্যাস তৈরি করুন এবং আপনার streak ধরে রাখুন।"
          />

          <Feature
            title="Goals"
            text="বড় লক্ষ্যকে ছোট ছোট ধাপে ভাগ করে এগিয়ে যান।"
          />

          <Feature
            title="Journal"
            text="আপনার চিন্তা, অভিজ্ঞতা এবং গুরুত্বপূর্ণ বিষয় লিখে রাখুন।"
          />

          <Feature
            title="Focus"
            text="গুরুত্বপূর্ণ কাজে মনোযোগ দেওয়ার জন্য focused time ব্যবহার করুন।"
          />

          <Feature
            title="Finance"
            text="আপনার আয়, ব্যয় এবং আর্থিক বিষয়গুলো এক জায়গায় রাখুন।"
          />

          <Feature
            title="Reminder"
            text="গুরুত্বপূর্ণ কাজ ও বিষয়গুলো সময়মতো মনে রাখুন।"
          />

          <Feature
            title="AI"
            text="AI ব্যবহার করে planning এবং productivity আরও সহজ করুন।"
          />

          <Feature
            title="One System"
            text="জীবনের গুরুত্বপূর্ণ বিষয়গুলো একটি system-এর মধ্যে পরিচালনা করুন।"
          />
        </div>
      </section>

      {/* =========================
          Closing
          ========================= */}
      <div className="mt-12 pb-6 text-center">
        <p className="text-lg font-semibold text-gray-900">
          Build your life. Organize your day. Reach your goals.
        </p>

        <p className="mt-2 text-sm text-gray-500">
          — LP Sojib
        </p>
      </div>
    </div>
  );
}

/* =========================
   Feature Card
   ========================= */
function Feature({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <h3 className="font-semibold text-gray-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {text}
      </p>
    </div>
  );
}