import { useNavigate } from "react-router-dom";

function Login() {

  const navigate = useNavigate();

  const users = [
    {
      id: "researcher",
      icon: "🔬",
      title: "Researcher",
      description:
        "Create studies, build protocols and manage research documents."
    },

    {
      id: "iec-secretariat",
      icon: "🏛",
      title: "IEC Secretariat",
      description:
        "Verify documents, manage submissions and coordinate IEC workflow."
    },

    {
      id: "iec-member",
      icon: "✓",
      title: "IEC Member",
      description:
        "Review research studies and provide IEC recommendations."
    },

    {
      id: "regulatory-admin",
      icon: "⚙",
      title: "Regulatory / Admin",
      description:
        "Manage regulatory tracking, users and platform operations."
    }
  ];


  return (

    <div className="user-selection-page">

      {/* BACKGROUND DECORATION */}

      <div className="selection-decoration decoration-one"></div>
      <div className="selection-decoration decoration-two"></div>


      {/* HEADER */}

      <header className="selection-header">

        <button
          className="back-home-button"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>


        <div className="selection-brand">

          <div className="brand-logo">
            A
          </div>

          <div>

            <h2>
              ALLA Ayurveda
            </h2>

            <span>
              Research & Knowledge Platform
            </span>

          </div>

        </div>

      </header>


      {/* MAIN */}

      <main className="selection-main">

        <div className="selection-heading">

          <span className="selection-eyebrow">
            PLATFORM ACCESS
          </span>

          <h1>
            Who are you?
          </h1>

          <p>
            Select your role to continue to the appropriate
            ALLA Ayurveda workspace.
          </p>

        </div>


        {/* USER CARDS */}

        <div className="user-card-grid">

          {users.map((user) => (

            <button
              key={user.id}
              className="user-selection-card"
              onClick={() =>
                navigate(`/user-login/${user.id}`)
              }
            >

              <div className="user-card-top">

                <div className="user-icon">
                  {user.icon}
                </div>

                <div className="user-arrow">
                  →
                </div>

              </div>


              <div className="user-card-content">

                <h2>
                  {user.title}
                </h2>

                <p>
                  {user.description}
                </p>

              </div>


              <div className="user-card-footer">

                <span>
                  Continue as {user.title}
                </span>

                <span>
                  →
                </span>

              </div>

            </button>

          ))}

        </div>


        {/* FOOT NOTE */}

        <div className="selection-note">

          <span>ⓘ</span>

          <p>
            Your selected role determines the workspace and
            permissions available after authentication.
          </p>

        </div>

      </main>


      {/* FOOTER */}

      <footer className="selection-footer">

        <span>
          SECURE ACCESS
        </span>

        <span>
          •
        </span>

        <span>
          AYURVEDA RESEARCH
        </span>

        <span>
          •
        </span>

        <span>
          ALLA PLATFORM
        </span>

      </footer>

    </div>
  );
}


export default Login;