import { useUser } from "../hooks/useUser";
import { SignOutButton } from "@clerk/clerk-react";

export default function Dashboard() {
  const { clerkUser, backendUser, isLoaded, isSignedIn, isCreating, error } =
    useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Please sign in to access the dashboard.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                TandemCode Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {clerkUser?.firstName}!
              </span>
              <SignOutButton>
                <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            {/* User Sync Status */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                User Sync Status
              </h2>

              {isCreating && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        🔄 Syncing your account with backend...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-800">❌ Error: {error}</p>
                    </div>
                  </div>
                </div>
              )}

              {backendUser && !isCreating && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-green-800">
                        ✅ Account synced successfully!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clerk User Info */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Clerk Authentication
                </h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      User ID
                    </dt>
                    <dd className="text-sm text-gray-900 font-mono">
                      {clerkUser?.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">
                      {clerkUser?.primaryEmailAddress?.emailAddress}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">
                      {clerkUser?.fullName}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Backend User Info */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Backend Database
                </h3>
                {backendUser ? (
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Database ID
                      </dt>
                      <dd className="text-sm text-gray-900 font-mono">
                        {backendUser.id}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Email
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {backendUser.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Name
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {backendUser.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Created
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(backendUser.createdAt).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-gray-500">
                    No backend user data available
                  </p>
                )}
              </div>
            </div>

            {/* Debug Information */}
            <div className="mt-8 bg-gray-100 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Debug Info
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Clerk Loaded: {isLoaded ? "✅" : "❌"}</div>
                <div>Signed In: {isSignedIn ? "✅" : "❌"}</div>
                <div>Creating User: {isCreating ? "🔄" : "✅"}</div>
                <div>Backend User Exists: {backendUser ? "✅" : "❌"}</div>
                <div>API Base: http://localhost:8080/api</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
