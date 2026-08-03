const GOOGLE_AD_SETTINGS_URL = "https://adssettings.google.com/";
const GOOGLE_AD_PRIVACY_URL = "https://policies.google.com/technologies/ads";
const CONTACT_URL = "https://github.com/choisw2718/Game_Chessle/issues";

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Site information">
      <div className="site-footer-heading">
        <div>
          <strong>CHESSLE</strong>
          <span>Daily · Random · 10 ply · 6 tries</span>
        </div>
        <small>© 2026 Chessle</small>
      </div>

      <div className="site-footer-disclosures">
        <details>
          <summary>About</summary>
          <div className="site-footer-detail">
            <h2>About Chessle</h2>
            <p>
              Chessle is an independent browser game for learning and recognizing named chess
              openings. Each puzzle asks you to reconstruct a ten-ply opening line in no more
              than six attempts. Daily mode offers one shared puzzle; Random mode offers
              unlimited practice.
            </p>
          </div>
        </details>

        <details>
          <summary>Guide</summary>
          <div className="site-footer-detail">
            <h2>How to play</h2>
            <p>
              Play five moves for White and Black on the board, then submit the line. Green
              means the move is in the correct position, gold means the move appears elsewhere
              in the answer, and gray means it is not part of the answer. You have six attempts.
            </p>
          </div>
        </details>

        <details>
          <summary>Privacy</summary>
          <div className="site-footer-detail">
            <h2>Privacy policy</h2>
            <p><strong>Last updated:</strong> August 3, 2026</p>
            <p>
              Your active games, play history, appearance settings, and an anonymous visitor
              identifier are stored in your browser so the game can continue on this device.
              You can remove this information by clearing this site&apos;s browser data.
            </p>
            <p>
              When a puzzle is completed, Chessle sends the anonymous identifier, puzzle ID,
              mode, date, result, and attempt count to Supabase. This data is used only to
              calculate community statistics such as solve rate and average attempts. Chessle
              does not require an account, name, or email address to play.
            </p>
            <p>
              If Google AdSense advertising is enabled, Google and other advertising vendors
              may use cookies to serve, limit, measure, and personalize ads based on visits to
              this and other websites. You can manage or opt out of personalized advertising in
              <a href={GOOGLE_AD_SETTINGS_URL} target="_blank" rel="noreferrer"> Google Ads Settings</a>.
              Learn more in <a href={GOOGLE_AD_PRIVACY_URL} target="_blank" rel="noreferrer">Google&apos;s advertising privacy information</a>.
            </p>
          </div>
        </details>

        <details>
          <summary>Terms</summary>
          <div className="site-footer-detail">
            <h2>Terms of use</h2>
            <p>
              Chessle is provided for entertainment and chess study. Opening names, move data,
              statistics, and availability are provided as-is and may contain errors or change
              without notice. You may use the site for personal, non-commercial play. Do not
              attempt to disrupt the service, manipulate shared statistics, or misuse automated
              access. Continued use of the site means you accept these terms.
            </p>
          </div>
        </details>

        <details>
          <summary>Contact</summary>
          <div className="site-footer-detail">
            <h2>Contact</h2>
            <p>
              For questions, corrections, privacy requests, or reports about the site, open an
              issue in the public Game_Chessle repository.
            </p>
            <a className="site-footer-contact" href={CONTACT_URL} target="_blank" rel="noreferrer">
              Contact via GitHub
            </a>
          </div>
        </details>
      </div>
    </footer>
  );
}
