/**
 * Footer component for the application
 */
export default function Footer() {
  return (
    <div className="mt-8 text-center text-sm text-gray-500">
      <p>© {new Date().getFullYear()} HCC Risk Assessment System. All rights reserved.</p>
      <p className="mt-1">
        Published in Nature Communications | DOI: 10.1038/s41467-XXX-XXXXX-X
      </p>
    </div>
  );
}
