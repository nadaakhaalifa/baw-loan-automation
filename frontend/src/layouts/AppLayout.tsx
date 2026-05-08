import { Link, useNavigate } from "react-router-dom";

import { removeToken } from "../utils/authStorage";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

function AppLayout({ children, title }: AppLayoutProps) {
  const navigate = useNavigate();

  function handleLogout() {
    removeToken();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-slate-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-8">BAW Loan</h1>

        <nav className="space-y-3">
          <Link className="block hover:text-blue-300" to="/dashboard">
            Customer Dashboard
          </Link>

          <Link className="block hover:text-blue-300" to="/manager">
            Manager Dashboard
          </Link>

          <Link className="block hover:text-blue-300" to="/finance">
            Finance Dashboard
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-10 w-full bg-red-600 hover:bg-red-700 p-2 rounded-lg"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
          <p className="text-gray-500 mt-1">
            Enterprise workflow automation dashboard
          </p>
        </div>

        {children}
      </main>
    </div>
  );
}

export default AppLayout;