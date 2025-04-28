/**
 * Footer component for the application
 */
export default function Footer() {
  return (
    <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500 px-4 py-2">
      <p>© {new Date().getFullYear()} HCC Risk Assessment System. All rights reserved.</p>
      <p className="mt-1">
        Published in XXX Journal | DOI: 10.1038/s41467-XXX-XXXXX-X
      </p>
    </div>
  );
}
