import AdminPanel from '../components/AdminPanel'

function AdminPage() {
    return (
        <main className="page">
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                    <h1 style={{ marginBottom: 'var(--space-md)' }}>
                        Admin Panel
                    </h1>
                    <p style={{ maxWidth: '600px', margin: '0 auto' }}>
                        Upload and manage mockup templates. Define where designs should be
                        placed on each template.
                    </p>
                </div>

                <AdminPanel />
            </div>
        </main>
    )
}

export default AdminPage
