import { Link } from 'react-router-dom'
import { CookieTable } from '@/components/CookieTable'
import { LegalPage, LegalSection } from '@/components/legal'
import { usePageTitle } from '@/hooks/usePageTitle'
import { BRAND_NAME, LEGAL_ADDRESS, LEGAL_EMAIL, LEGAL_ENTITY, PRIVACY_UPDATED, REPO, REPO_URL, SITE_DOMAIN } from '@/lib/brand'
import { openConsentSettings } from '@/lib/consent'

/** Reads like the links around it, but opens the cookie dialog instead of navigating. */
function CookieSettingsButton() {
  return (
    <button type="button" onClick={openConsentSettings} className="text-foreground underline underline-offset-4">
      Cookies
    </button>
  )
}

export default function Privacy() {
  usePageTitle('Privacy Policy', `What ${BRAND_NAME} collects, how it is used, and the choices you have.`)
  return (
    <LegalPage
      title="Privacy Policy"
      updated={PRIVACY_UPDATED}
      intro={
        <p>
          This policy explains how {LEGAL_ENTITY} (“Community Labs,” “we,” “us,” “our”) collects, uses, and shares
          information when you visit {SITE_DOMAIN}, sign in, or post a result. It also describes the choices and rights
          you have over that information.
        </p>
      }
      callout={
        <>
          We use Google Analytics to see which pages get used, and nothing else. It stays switched off until you accept
          it in the cookie banner, we set no advertising cookies at all, and you can change your answer any time from{' '}
          <CookieSettingsButton /> in the footer.
        </>
      }
    >
      <LegalSection id="overview" heading="Overview">
        <p>
          {BRAND_NAME} is a public leaderboard. Almost everything it holds is meant to be seen: the results people post,
          the machines they describe, the photos of those machines, and the GitHub handle attached to each. We collect
          very little beyond that, we do not sell personal information, and we do not use it for advertising.
        </p>
        <p>
          This policy covers the website. It does not cover GitHub, the runtimes and models named on the site, or any
          other service you reach by following a link from here.
        </p>
      </LegalSection>

      <LegalSection id="what-we-collect" heading="Information we collect">
        <h3>Information you give us</h3>
        <p>
          You can read every board without signing in or giving us anything. You choose to share information when you
          take part:
        </p>
        <ul>
          <li>
            <strong>Sign-in.</strong> You sign in with GitHub. We ask GitHub only for your public profile, and we store
            your GitHub user id, handle, display name, avatar URL, and public bio. We never receive your GitHub password
            and we never ask for access to your repositories.
          </li>
          <li>
            <strong>What you post.</strong> Rigs and their components, results and their measurements, runtime versions,
            flags and settings, notes, evidence links, and custom runtime registrations. All of it is public.
          </li>
          <li>
            <strong>Rig photos.</strong> If you upload a photo of a machine, we store the image file and serve it
            publicly. Check what is in the frame: anything visible in a photo — a screen, a label, a room — is published
            with it.
          </li>
          <li>
            <strong>Confirmations and flags.</strong> When you confirm or flag someone else’s result, we record that it
            was you, so that each member counts once and so we can look into patterns of abuse.
          </li>
          <li>
            <strong>Direct correspondence.</strong> If you email us or open an issue or pull request, we receive your
            message and whatever you choose to include in it.
          </li>
        </ul>
        <h3>Information collected automatically</h3>
        <p>
          Our hosting and database providers keep the ordinary server logs any website has — IP address, user agent,
          the URL requested, and the time — which are used to serve the site, keep it available, and defend it against
          abuse. We do not build profiles from them.
        </p>
        <p>
          If, and only if, you accept analytics cookies, Google Analytics collects the ordinary usage information: the
          pages you look at, the link that sent you here, an approximate city-level location worked out from your IP
          address, your device and browser type, and general interaction events. That tells us which boards people
          actually read. Until you accept, no analytics cookie is set and none of this is collected.
        </p>
      </LegalSection>

      <LegalSection id="cookies" heading="Cookies and local storage">
        <p>
          Most of what this site keeps is not a cookie in the strict sense: it lives in your browser’s local and session
          storage. Google Analytics does set real cookies. “Cookies” is the word people look for either way, so it is
          the word the banner and this section use, and everything below is disclosed and controlled the same way.
        </p>
        <p>
          We group storage into four categories — strictly necessary, functional, analytics, and marketing. Everything
          outside strictly necessary runs through Google Consent Mode, which denies it by default, so nothing is placed
          until you opt in. Strictly necessary storage keeps you signed in, returns you to the page you were reading
          when you signed in, and remembers your choice here so we stop asking. Analytics is Google Analytics 4 and
          nothing else. The functional and marketing categories are empty today.
        </p>
        <p>Everything this site stores, by category:</p>
        <CookieTable />
        <p>
          You can change or withdraw your choice at any time from <CookieSettingsButton /> in the footer, or by clearing
          site data in your browser. Clearing it signs you out and makes the banner ask again. You can also opt out of
          Google Analytics across every site with Google’s browser add-on at{' '}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noreferrer">
            tools.google.com/dlpage/gaoptout
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="how-we-use" heading="How we use information">
        <p>We use the information described above to:</p>
        <ul>
          <li>run the site: show boards, attribute a result to the person who posted it, and keep you signed in;</li>
          <li>
            let the community check itself, through confirmations, flags, and the moderation those trigger, and to
            detect duplicate accounts, coordinated voting, and other abuse;
          </li>
          <li>answer you when you get in touch;</li>
          <li>keep the site secure, available, and working; and</li>
          <li>
            comply with legal obligations and enforce our <Link to="/terms">Terms of Service</Link>.
          </li>
        </ul>
        <p>
          Where the law requires a lawful basis, we rely on your consent for anything in the functional, analytics, or
          marketing categories, on the performance of our contract with you for running your account and publishing what
          you post, and on our legitimate interest in operating, securing, and improving the site for everything else.
          You may withdraw consent at any time.
        </p>
      </LegalSection>

      <LegalSection id="how-we-share" heading="How we share information">
        <p>We do not sell your personal information. It is shared in these ways:</p>
        <ul>
          <li>
            <strong>Publicly, by design.</strong> Your handle, avatar, profile, rigs, photos, results, and the
            confirmations and flags counted against an entry are visible to everyone, indexed by search engines, and
            included in the preview cards generated when someone shares a link. Results submitted by pull request, and
            catalog entries, are also public in{' '}
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              {REPO}
            </a>
            , where anyone can copy them.
          </li>
          <li>
            <strong>Service providers.</strong> Vercel hosts the site, Supabase provides the database, authentication,
            and photo storage, GitHub provides sign-in, and Google provides analytics once you have accepted them. They
            process information on our behalf and may use it only to provide those services to us.
          </li>
          <li>
            <strong>Legal and safety.</strong> We may disclose information if required by law, or to protect the rights,
            property, or safety of Community Labs, the people who use the site, or the public.
          </li>
          <li>
            <strong>Business transfers.</strong> If we are involved in a merger, acquisition, or sale of assets,
            information may be transferred as part of that transaction.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="third-parties" heading="Third-party services and links">
        <p>
          The site links out to GitHub, to runtime and model projects, to vendor pages, and to the evidence links people
          attach to results. When you follow one of those links, or sign in through GitHub, that service’s own privacy
          policy governs what it collects. We encourage you to read them. We are not responsible for the privacy
          practices of services we do not operate.
        </p>
      </LegalSection>

      <LegalSection id="retention" heading="Data retention">
        <p>
          We keep information only as long as we need it for the purposes in this policy. Account information is kept
          while your account exists. Results, rigs, and photos are kept while they are published, and they may remain
          after you close your account where other members have confirmed them or where rankings and links depend on
          them; ask us and we will remove your name from an entry that has to stay. Correspondence is kept as long as
          reasonably necessary to deal with the matter and to meet legal or accounting requirements. Server logs are
          kept for a short period on our providers’ ordinary schedules, and analytics data is kept on the schedule set
          in our Google Analytics property, in aggregate or pseudonymous form.
        </p>
      </LegalSection>

      <LegalSection id="security" heading="Data security">
        <p>
          We use reasonable technical and organizational measures to protect information against loss, misuse, and
          unauthorized access. No method of transmission or storage is completely secure, however, and we cannot
          guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection id="international" heading="International transfers">
        <p>
          We are based in the United States, and the providers we use may process information in the United States and
          other countries. If you use the site from outside the United States, you understand that your information may
          be transferred to, stored, and processed in a country whose data protection laws differ from those of your
          own. Where required, we rely on appropriate safeguards for such transfers.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" heading="Your privacy rights">
        <p>
          Depending on where you live, you may have some or all of the following rights over your personal information:
          to access it, to correct it, to delete it, to restrict or object to its processing, to receive a portable
          copy, and to withdraw consent you have given. You can edit or delete most of what you post directly on the
          site. For anything else, contact us at <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>. We will respond as
          required by applicable law, and we will not discriminate against you for exercising your rights.
        </p>
        <h3>If you are in the European Economic Area or the United Kingdom</h3>
        <p>
          You have the rights described above under applicable data protection law. Our lawful bases are consent (for
          any non-essential storage), performance of a contract (for your account and what you publish), and legitimate
          interests (for correspondence, site operation, and security). You also have the right to lodge a complaint
          with your local data protection authority.
        </p>
        <h3>If you are a California resident</h3>
        <p>
          You have the right to know what personal information we collect and how we use and share it, to request access
          to or deletion of it, to correct it, and to opt out of its sale or sharing. We do not sell or share personal
          information as those terms are defined under California law. You may exercise these rights using the contact
          details below, and we will not discriminate against you for doing so.
        </p>
      </LegalSection>

      <LegalSection id="children" heading="Children’s privacy">
        <p>
          This site is not directed to children, and we do not knowingly collect personal information from anyone under
          16. If you believe a child has given us personal information, contact us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection id="changes" heading="Changes to this policy">
        <p>
          We may update this policy from time to time. When we do, we will revise the “Last updated” date at the top of
          this page, and a material change to what we store will make the banner ask you again. Your continued use of
          the site after an update means you accept the revised policy.
        </p>
      </LegalSection>

      <LegalSection id="contact" heading="Contact us">
        <p>
          If you have any questions about this policy or how we handle your information, contact us at{' '}
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>, or by mail at {LEGAL_ENTITY}, {LEGAL_ADDRESS}.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
