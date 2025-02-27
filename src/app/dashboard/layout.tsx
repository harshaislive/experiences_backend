'use client';

import { Fragment, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  MapPinIcon,
  CalendarIcon,
  ArrowLeftOnRectangleIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

const navigation = [
  { name: 'Locations', href: '/dashboard/locations', icon: MapPinIcon },
  { name: 'Experiences', href: '/dashboard/experiences', icon: CalendarIcon },
  { name: 'Registrations', href: '/dashboard/registrations', icon: UserGroupIcon },
  { name: 'Help', href: '/dashboard/help', icon: QuestionMarkCircleIcon },
  { name: 'Diagnostics', href: '/dashboard/diagnostics', icon: WrenchScrewdriverIcon },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div>
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-[#342e29]/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#fdfbf7] px-6 pb-2 border-r border-[#e7e4df]">
                  <div className="flex h-16 shrink-0 items-center">
                    <Link href="/dashboard" className="flex items-center gap-3">
                      <Image
                        src="/logo.png"
                        alt="Beforest Logo"
                        width={48}
                        height={48}
                        className="object-contain"
                        priority={true}
                      />
                    </Link>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className={`
                                  group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                                  ${
                                    pathname === item.href
                                      ? 'bg-[#344736] text-[#fdfbf7]'
                                      : 'text-[#342e29] hover:text-[#344736] hover:bg-[#e7e4df]'
                                  }
                                `}
                              >
                                <item.icon
                                  className={`h-6 w-6 shrink-0 ${
                                    pathname === item.href
                                      ? 'text-[#b8dc99]'
                                      : 'text-[#51514d] group-hover:text-[#344736]'
                                  }`}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-[#e7e4df] bg-[#fdfbf7] px-6">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Beforest Logo"
                width={48}
                height={48}
                className="object-contain"
                priority={true}
              />
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`
                          group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                          ${
                            pathname === item.href
                              ? 'bg-[#344736] text-[#fdfbf7]'
                              : 'text-[#342e29] hover:text-[#344736] hover:bg-[#e7e4df]'
                          }
                        `}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${
                            pathname === item.href
                              ? 'text-[#b8dc99]'
                              : 'text-[#51514d] group-hover:text-[#344736]'
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-[#342e29] hover:bg-[#e7e4df] disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <LoadingSpinner size="sm" text="" />
                  ) : (
                    <ArrowLeftOnRectangleIcon
                      className="h-6 w-6 text-[#51514d]"
                      aria-hidden="true"
                    />
                  )}
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-[#fdfbf7] px-4 py-4 shadow-sm border-b border-[#e7e4df] sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-[#342e29] hover:text-[#344736] lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Beforest Logo"
            width={40}
            height={40}
            className="object-contain"
            priority={true}
          />
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-[#342e29] hover:text-[#344736] disabled:opacity-50"
        >
          {isLoggingOut ? (
            <LoadingSpinner size="sm" text="" />
          ) : (
            <ArrowLeftOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      <main className="lg:pl-72">
        <ErrorBoundary>
          <div className="min-h-screen bg-[#fdfbf7]">{children}</div>
        </ErrorBoundary>
      </main>
    </div>
  );
}
