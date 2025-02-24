'use client';

import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-semibold tracking-tight text-[#342e29]">
            Help Center
          </h1>
          <p className="mt-4 text-lg text-[#51514d]">
            Learn how to manage your locations and experiences
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Locations Guide */}
          <div className="bg-[#fdfbf7]/70 backdrop-blur-xl rounded-2xl shadow-[0_2px_20px_rgba(52,46,41,0.04)] overflow-hidden border border-[#e7e4df]">
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-[#342e29] mb-6">Adding Locations</h2>
              <div className="space-y-4">
                <p className="text-[#51514d]">Follow these steps to add a new location:</p>
                <ol className="list-decimal list-inside space-y-3 text-[#51514d]">
                  <li>Navigate to the <Link href="/dashboard/locations" className="text-[#344736] hover:text-[#415c43] hover:underline">Locations</Link> page</li>
                  <li>Click the &quot;New Location&quot; button in the top right</li>
                  <li>Fill in the required information:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-2">
                      <li>Name: A descriptive name for the location</li>
                      <li>Slug: A URL-friendly version of the name (auto-generated)</li>
                      <li>Description: Details about the location</li>
                      <li>Status: Active or Inactive</li>
                    </ul>
                  </li>
                  <li>Click &quot;Save&quot; to create the location</li>
                </ol>
                <div className="mt-6">
                  <Link 
                    href="/dashboard/locations" 
                    className="inline-flex items-center text-[#344736] hover:text-[#415c43] hover:underline"
                  >
                    Go to Locations
                    <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Experiences Guide */}
          <div className="bg-[#fdfbf7]/70 backdrop-blur-xl rounded-2xl shadow-[0_2px_20px_rgba(52,46,41,0.04)] overflow-hidden border border-[#e7e4df]">
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-[#342e29] mb-6">Creating Experiences</h2>
              <div className="space-y-4">
                <p className="text-[#51514d]">Follow these steps to create a new experience:</p>
                <ol className="list-decimal list-inside space-y-3 text-[#51514d]">
                  <li>Navigate to the <Link href="/dashboard/experiences" className="text-[#344736] hover:text-[#415c43] hover:underline">Experiences</Link> page</li>
                  <li>Click the &quot;New Experience&quot; button in the top right</li>
                  <li>Fill in the basic information:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-2">
                      <li>Title: A catchy name for the experience</li>
                      <li>Location: Select from your existing locations</li>
                      <li>Description: Detailed information about the experience</li>
                      <li>Dates: Start and end dates</li>
                      <li>Capacity: Maximum number of participants</li>
                    </ul>
                  </li>
                  <li>After creating the experience, you can manage:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-2">
                      <li>Pricing: Set different price categories</li>
                      <li>Items to Bring: List required and optional items</li>
                      <li>Food Options: Add meal choices and dietary options</li>
                      <li>Images: Upload and manage experience photos</li>
                    </ul>
                  </li>
                </ol>
                <div className="mt-6">
                  <Link 
                    href="/dashboard/experiences" 
                    className="inline-flex items-center text-[#344736] hover:text-[#415c43] hover:underline"
                  >
                    Go to Experiences
                    <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="bg-[#fdfbf7]/70 backdrop-blur-xl rounded-2xl shadow-[0_2px_20px_rgba(52,46,41,0.04)] overflow-hidden border border-[#e7e4df]">
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-[#342e29] mb-6">Tips & Best Practices</h2>
              <div className="space-y-4 text-[#51514d]">
                <h3 className="font-medium text-[#342e29]">For Locations:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Use clear, descriptive names that are easy to remember</li>
                  <li>Provide detailed descriptions including amenities and features</li>
                  <li>Keep location information up to date</li>
                </ul>

                <h3 className="font-medium text-[#342e29] mt-6">For Experiences:</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Create compelling titles that reflect the experience</li>
                  <li>Set realistic capacity limits based on location and activities</li>
                  <li>Include all necessary items in the &quot;Items to Bring&quot; list</li>
                  <li>Offer diverse food options to accommodate different dietary needs</li>
                  <li>Use high-quality images that showcase the experience</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 