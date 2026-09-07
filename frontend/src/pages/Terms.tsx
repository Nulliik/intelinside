import { Link } from 'react-router-dom'
import { LegalPage, LegalSection } from '@/components/legal'
import { usePageTitle } from '@/hooks/usePageTitle'
import { BRAND_NAME, LEGAL_ADDRESS, LEGAL_EMAIL, LEGAL_ENTITY, REPO, REPO_URL, TERMS_UPDATED } from '@/lib/brand'

export default function Terms() {
  usePageTitle('Terms of Service', `The terms that govern your use of ${BRAND_NAME}.`)
  return (
    <LegalPage
      title="Terms of Service"
      updated={TERMS_UPDATED}
      intro={
        <>
          <p>
            {BRAND_NAME} is a community leaderboard of AI inference on Intel hardware, operated by {LEGAL_ENTITY}{' '}
            (“Community Labs,” “we,” “us,” “our”). People sign in with GitHub, register the machines they run models on,
            and post the speeds they measure.
          </p>
          <p>
            Your use of the site is subject to these Terms of Service (these “Terms”) and to our{' '}
            <Link to="/privacy">Privacy Policy</Link>. If you use the site, you and we mutually agree that these Terms
            are a binding, legally enforceable contract between you and us.
          </p>
        </>
      }
      callout={
        <>
          These Terms contain a mandatory arbitration provision that, as set out in the “Arbitration” section below,
          requires the use of arbitration on an individual basis to resolve disputes. It does not allow jury trials or
          any other court proceedings or class actions of any kind.
        </>
      }
    >
      <LegalSection id="eligibility" heading="Your account and eligibility">
        <p>
          Reading the site takes no account. To register a rig, post a result, or confirm or flag someone else’s, you
          sign in with GitHub, and your {BRAND_NAME} account is tied to that GitHub account. We read your public GitHub
          profile and nothing else. You are responsible for keeping your GitHub credentials secure and for everything
          done on your account, whether or not you authorized it.
        </p>
        <p>
          You may not open an account or use the site if (i) you have not accepted and agreed to be bound by these
          Terms, (ii) you appear on the United States Department of the Treasury, Office of Foreign Assets Control
          (OFAC), Specially Designated Nationals List (SDN), the United States Commerce Department’s Denied Persons
          list, or other similar lists, (iii) you are a national or resident of Cuba, Iran, North Korea, Sudan, Syria,
          or any other country, territory, or jurisdiction that is the subject of comprehensive country-wide,
          territory-wide, or regional economic sanctions by the United States, (iv) we have previously terminated your
          account or your use of the site, or (v) you are younger than the age of majority where you live or are
          otherwise not legally permitted to enter into these Terms.
        </p>
      </LegalSection>

      <LegalSection id="your-information" heading="Your personal information">
        <p>
          We ask for very little: what your GitHub profile already makes public, and whatever you choose to put in a
          result, a rig, or your profile. Our <Link to="/privacy">Privacy Policy</Link> describes what we collect, how
          we use it, and the choices you have. You represent that the information you give us is true and accurate, and
          that you will update it when it changes.
        </p>
        <p>
          Where we need it to run the site, comply with the law, or answer a lawful request from a court, regulator, or
          law enforcement agency, you agree we may disclose that information to our service providers, who may use it
          only to provide their services to us, and to the authority making the request.
        </p>
      </LegalSection>

      <LegalSection id="what-you-post" heading="What you post">
        <p>
          Results, rigs, rig photos, custom runtime registrations, notes, and your profile are “your submissions.”
          Everything you submit is public the moment you post it. Anyone can read it, link to it, quote it, and share a
          card of it, and search engines will index it. Do not put anything in a submission that you would not want
          published, including anything identifying that happens to be visible in a rig photo.
        </p>
        <p>You represent and warrant, for every submission, that:</p>
        <ul>
          <li>
            you measured the numbers yourself, on the hardware, runtime, model, and quantization you named, in the way
            the <Link to="/guidelines">guidelines</Link> describe, and you have reported them accurately and without
            omitting a setting that materially changes them;
          </li>
          <li>
            you are not passing off a throughput figure, a synthetic figure, a figure produced by someone else, or a
            figure from a different configuration as your own decode measurement;
          </li>
          <li>you own or have the rights to everything you post, including every photo, and posting it here infringes nobody;</li>
          <li>
            it contains nothing harmful, offensive, or illegal, including anything that disparages or harasses a person
            or group on the basis of race, national origin, religion, disability, appearance, gender, gender identity,
            or sexual orientation;
          </li>
          <li>
            it contains no personal or private information about anyone else, no advertising or other solicitation, and
            no malware, and it is not spam or a duplicate posted to inflate a ranking; and
          </li>
          <li>it does not impersonate any other person, project, or vendor.</li>
        </ul>
        <p>
          You keep the rights you have in your submissions. You grant us a worldwide, non-exclusive, royalty-free,
          perpetual, irrevocable licence to host, store, reproduce, adapt for display, publish, and distribute them in
          connection with the site and its promotion, including in share cards and aggregate statistics, and to
          sublicense those rights to the providers who host the site for us. That licence is what lets us show your
          result on a board and keep it there. It survives the closing of your account for submissions that others have
          already relied on, cited, or built rankings from.
        </p>
      </LegalSection>

      <LegalSection id="using-the-site" heading="Using the site">
        <p>You agree that you will not:</p>
        <ul>
          <li>interfere with or compromise the integrity, security, or proper working of the site or the systems behind it;</li>
          <li>
            use automated means to submit content, to confirm or flag entries, or to place load on the site beyond
            ordinary reading;
          </li>
          <li>
            create more than one account, or coordinate with others, in order to move a ranking, add confirmations, or
            bury an entry under flags;
          </li>
          <li>attempt to gain access to an account, a record, or a part of the site that is not yours; or</li>
          <li>use the site in a way that violates any applicable law or regulation.</li>
        </ul>
      </LegalSection>

      <LegalSection id="moderation" heading="Verification, flags, and moderation">
        <p>
          Every result starts self-reported. Signed-in members confirm results they have reproduced or checked, and
          enough confirmations make a result community-verified. Members can also flag an entry, and past a threshold a
          flagged entry is hidden pending review. Confirming and flagging are statements you are making: confirm only
          what you actually checked, and flag only what you actually believe is wrong.
        </p>
        <p>
          We may edit, hide, or remove any submission, and suspend or close any account, at any time and at our sole
          discretion, with or without notice — including where a submission looks implausible, misdescribes the
          hardware, duplicates another, or breaks these Terms. We are under no obligation to review, verify, or keep any
          submission, and nothing here creates one.
        </p>
      </LegalSection>

      <LegalSection id="repository" heading="The public repository">
        <p>
          The site’s catalog of hardware, models, runtimes, and quantizations, and results submitted by pull request,
          live in the public repository at{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            {REPO}
          </a>
          . Anything you contribute there is public, redistributable by anyone under that repository’s licence, and
          governed by these Terms as well. A pull request is a submission for the purposes of these Terms, and the same
          representations apply to it.
        </p>
      </LegalSection>

      <LegalSection id="changes-to-the-site" heading="Service changes, suspension, and termination">
        <p>
          You acknowledge that we may update, enhance, modify, or otherwise change the site, what it shows, how it
          ranks, and the rules and policies that govern it, at any time, without notice, and at our sole and absolute
          discretion. No such change is a breach of these Terms by us or gives rise to any obligation or liability on
          our part. Boards, catalogs, and features may appear and disappear.
        </p>
        <p>
          You may stop using the site at any time. We may terminate or suspend your use of the site at any time, with or
          without notice.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" heading="Third-party services and links">
        <p>
          The site relies on services we do not operate — GitHub for sign-in, and providers who host the application and
          its database — and it links out to repositories, runtime projects, model pages, vendor sites, and the
          evidence links people attach to their results. When you follow one of those links or sign in through one of
          those services, that third party’s own terms and privacy policy govern what happens there. We are not
          responsible for services we do not operate, and a link is not an endorsement.
        </p>
      </LegalSection>

      <LegalSection id="no-warranties" heading="No warranties by us; release">
        <p>
          The site and everything on it are provided AS IS, without warranty of any kind, and your use of it is at your
          sole risk. <strong>The numbers here are self-reported by members of the public.</strong> They are not lab
          benchmarks, we do not reproduce them, and community verification is the opinion of other members rather than a
          guarantee by us. A result can be mistaken, stale, measured differently from how you would measure it, or
          simply false. Do not treat anything here as advice about what hardware to buy or what performance you will
          see, and do not rely on it for any purchasing, engineering, or business decision without checking it yourself.
        </p>
        <p>
          We expressly disclaim (i) any warranty that the site will be uninterrupted, available, or error free and (ii)
          all implied warranties, including any implied warranties of merchantability, fitness for a particular purpose,
          accuracy, and non-infringement.
        </p>
        <p>
          You waive and release us from any and all liabilities, claims, causes of action, or damages arising from or
          relating to the site, your submissions, or anyone else’s. Further, you waive the benefits and protections of
          California Civil Code § 1542 or any similar law in the jurisdiction where you live. California Civil Code §
          1542 provides: “[a] general release does not extend to claims that the creditor or releasing party does not
          know or suspect to exist in his or her favor at the time of executing the release and that, if known by him or
          her, would have materially affected his or her settlement with the debtor or released party.”
        </p>
      </LegalSection>

      <LegalSection id="indemnification" heading="Indemnification">
        <p>
          You will be responsible for and will pay us and our affiliates, partners, vendors, suppliers, service
          providers, and personnel the amount of any loss, damage, fine, penalty, liability, cost, or expense (including
          reasonable attorneys’ fees) (collectively, “Losses”) arising out of or in connection with your use of the
          site, your submissions, any claim brought by anyone in relation to them, or any termination of or interruption
          to your use of the site, but excluding any Losses to the extent attributable to our breach of these Terms or
          violation of law.
        </p>
      </LegalSection>

      <LegalSection id="intellectual-property" heading="Intellectual property and trademarks">
        <p>
          As between you and us, we or our licensors own all intellectual property rights in the site itself — its
          software, design, and the compilation and arrangement of what it shows — and you or your licensors own all
          intellectual property rights in your submissions, subject to the licence you grant above. We grant you a
          non-exclusive, limited, revocable, personal, non-assignable licence to use the site for its intended purpose,
          in accordance with these Terms, with no right to grant sublicences. We reserve all rights not expressly
          granted here.
        </p>
        <p>
          <strong>{BRAND_NAME} is an independent community project.</strong> Intel, Arc, Core Ultra, Xeon, and Gaudi are
          trademarks of Intel Corporation. Every other hardware, runtime, and model name on this site is a trademark of
          its owner. We use those names only to identify the hardware and software a result ran on, which is a
          descriptive use. We are not affiliated with, endorsed by, sponsored by, or otherwise connected to Intel
          Corporation or to any other vendor or project named here, and nothing on the site should be read as a claim
          that we are.
        </p>
      </LegalSection>

      <LegalSection id="feedback" heading="Feedback">
        <p>
          We welcome questions, comments, and other feedback about these Terms or the site, including ideas, proposals,
          suggestions, or other materials (“Feedback”). You acknowledge and agree that we will treat all Feedback as
          non-confidential, and you grant us a non-exclusive, worldwide, perpetual, irrevocable, royalty-free,
          fully-paid-up licence to create derivative works based on your Feedback and to reproduce, publicly display,
          publicly perform, use, commercialize, disclose, import, and distribute that Feedback and those derivative
          works in any way and for any purpose, and to assign or otherwise transfer that licence or authorize others to
          do any of the foregoing, without notice or obligation to you. Your provision of Feedback is gratuitous,
          unsolicited, and without restriction, and places us under no fiduciary or other obligation.
        </p>
      </LegalSection>

      <LegalSection id="amendments" heading="Amendments to these Terms">
        <p>
          We may change these Terms at any time by posting a new version of them here and revising the “Last updated”
          date at the top of this page. We will make reasonable efforts to make the community aware of any change;
          provided that you must monitor this page for amendments. Your continued use of the site after a change means
          you accept the revised Terms.
        </p>
      </LegalSection>

      <LegalSection id="arbitration" heading="Arbitration">
        <p>
          <strong>
            Please read this provision very carefully. It limits your rights in the event of a dispute between you and
            us.
          </strong>
        </p>
        <p>
          You and we agree that any and all past, present, and future disputes, controversies, claims, or causes of
          action arising out of or relating to the site, your use of it, your submissions, these Terms, our Privacy
          Policy, or your account, and any other controversies or disputes between you and us (including disputes
          regarding the effectiveness, scope, validity, or enforceability of this agreement to arbitrate) (collectively,
          “Dispute(s)”), shall be determined by arbitration, unless (A) your Country of Residence does not allow this
          arbitration agreement; (B) you opt out as provided below; or (C) your Dispute is subject to an exception to
          this agreement to arbitrate set out below. You and we further agree that any arbitration pursuant to this
          section shall not proceed as a class, group, or representative action. The award of the arbitrator may be
          entered in any court having jurisdiction.
        </p>
        <p>
          “Country of Residence” for purposes of this agreement to arbitrate means the country in which you hold
          citizenship or legal permanent residence; provided that if you have more than one country of citizenship or
          legal permanent residence, it shall be the country in which you hold citizenship or legal permanent residence
          with which you are most closely associated by permanent or most frequent residence.
        </p>
        <p>
          We want to address your concerns without the need for a formal dispute resolution process. Before filing a
          claim against us, you agree to try to resolve the Dispute informally by contacting us in writing at{' '}
          {LEGAL_ADDRESS}, or by e-mail at <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>, to notify us of the
          actual or potential Dispute. Similarly, we will undertake reasonable efforts to contact you to notify you of
          any actual or potential dispute in order to resolve any claim we may have informally before taking any formal
          action. The party that provides the notice of the actual or potential Dispute (the “Notifying Party”) will
          include in that notice (a “Notice of Dispute”) your name (to the extent known), the Notifying Party’s contact
          information for any communications relating to such Dispute (including for the Notifying Party’s legal counsel
          if it is represented by counsel in connection with such Dispute), and sufficient details regarding such
          Dispute to enable the other party (the “Notified Party”) to understand the basis of and evaluate the concerns
          raised in such Dispute. If the Notified Party responds within ten (10) business days after receiving the
          Notice of Dispute that it is ready and willing to engage in good faith discussions in an effort to resolve the
          Dispute informally, then each party shall promptly participate in such discussions in good faith.
        </p>
        <p>
          If, notwithstanding the Notifying Party’s compliance with all of its obligations under the preceding
          paragraph, a Dispute is not resolved within 30 days after the Notice of Dispute is sent (or if the Notified
          Party fails to respond to the Notice of Dispute within ten (10) business days), the Notifying Party may
          initiate an arbitration proceeding as described below. If either party purports to initiate arbitration
          without first providing a Notice of Dispute and otherwise complying with all of its obligations under the
          preceding paragraph, then, notwithstanding any other provision of these Terms, the arbitrator(s) will promptly
          dismiss the claim with prejudice and will award the other party all of its costs and expenses (including
          reasonable attorneys’ fees) incurred in connection with such Dispute.
        </p>
        <p>
          Unless you opt out of this agreement to arbitrate as provided below, you and we each agree to resolve any
          Disputes that are not resolved informally as described above through final and binding arbitration as
          discussed herein, subject to the exceptions set out below.
        </p>
        <p>
          If you do not wish to be subject to this agreement to arbitrate, you may opt out of this arbitration provision
          by sending a written notice to us at {LEGAL_ADDRESS}, or by e-mail at{' '}
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>, within thirty (30) days of the first time you accept
          these Terms (or any prior version of these Terms) or, if earlier, your first use of the site. You must date
          the notice and include your first and last name, address, and a clear statement that you do not wish to
          resolve disputes with us through arbitration. If no notice is submitted in the manner described above by the
          30-day deadline, you will have irrevocably waived your right to litigate any Dispute except with regard to the
          exceptions set out below. By opting out of the agreement to arbitrate, you will not be precluded from using
          the site, but you and we will not be permitted to invoke the mutual agreement to arbitrate to resolve Disputes
          under the terms otherwise provided herein.
        </p>
        <p>
          You and we agree that the American Arbitration Association (“AAA”) will administer the arbitration under its
          Commercial Arbitration Rules in effect at the time arbitration is sought (“AAA Rules”). Those rules are
          available at www.adr.org or by calling the AAA at 1-800-778-7879. A party who desires to initiate arbitration
          must provide the other party with a written Demand for Arbitration as specified in the AAA Rules. (The AAA
          provides a general Demand for Arbitration.) Arbitration will proceed on an individual basis and will be
          handled by a sole arbitrator. The single arbitrator will be either a retired judge or an attorney licensed to
          practice law and will be selected by the parties from the AAA’s roster of arbitrators. If the parties are
          unable to agree upon an arbitrator within fourteen (14) days of delivery of the Demand for Arbitration, then
          the AAA will appoint the arbitrator in accordance with the AAA Rules. The arbitrator(s) shall be authorized to
          award any remedies, including injunctive relief, that would be available in an individual lawsuit, other than
          remedies that you effectively waived pursuant to these Terms. Notwithstanding any language to the contrary in
          this paragraph, if a party seeks injunctive relief that would significantly impact other of our users, as
          reasonably determined by either party, the parties agree that such arbitration will proceed on an individual
          basis but will be handled by a panel of three (3) arbitrators. In that event, each party shall select one
          arbitrator, and the two party-selected arbitrators shall select the third, who shall serve as chair of the
          arbitral panel. That chairperson shall be a retired judge or an attorney licensed to practice law with
          experience arbitrating or mediating disputes. In the event of disagreement as to whether the threshold for a
          three-arbitrator panel has been met, the sole arbitrator appointed in accordance with this section shall make
          that determination. If the arbitrator determines a three-person panel is appropriate, the arbitrator may — if
          selected by either party or as the chair by the two party-selected arbitrators — participate in the arbitral
          panel. Except as may be and to the extent otherwise required by law, the arbitration proceeding and any award
          shall be confidential.
        </p>
        <p>
          You and we further agree that the arbitration will be held in the English language in the city and state of
          New York, or, if you so elect, all proceedings can be conducted via videoconference, telephonically, or via
          other remote electronic means. Each party shall bear the expense of its own attorneys’ fees, except as
          otherwise provided herein or required by law.
        </p>
        <p>
          Regardless of the rules of a given arbitration forum, you and we agree that the arbitration of any Dispute
          shall proceed on an individual basis, and neither you nor we may bring a claim as a part of a class, group,
          collective, coordinated, consolidated, or mass arbitration (each, a “Collective Arbitration”). Without
          limiting the generality of the foregoing, a claim to resolve any Dispute against us will be deemed a
          Collective Arbitration if (i) two (2) or more similar claims for arbitration are filed concurrently; and (ii)
          counsel for the claimants are the same, share fees, or coordinate across the arbitrations. “Concurrently” for
          purposes of this provision means that both arbitrations are pending (filed but not yet resolved) at the same
          time.
        </p>
        <p>
          To the maximum extent permitted by applicable law, neither you nor we shall be entitled to consolidate, join,
          or coordinate disputes by or against other individuals or entities with any Disputes, or to arbitrate or
          litigate any Dispute in a representative capacity, including as a representative member of a class or in a
          private attorney general capacity. In connection with any Dispute, any and all such rights are hereby
          expressly and unconditionally waived. Without limiting the foregoing, any challenge to the validity of this
          paragraph or otherwise relating to the prohibition of Collective Arbitration shall be determined exclusively
          by the arbitrator.
        </p>
        <p>
          Notwithstanding the agreement between you and us to arbitrate Disputes, you and we each retain the following
          rights:
        </p>
        <ul>
          <li>
            If your Country of Residence is the United States, you and we retain the right (A) to bring an individual
            action in small claims court; and (B) to seek injunctive or other equitable relief in a court of competent
            jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of a party’s
            copyrights, trademarks, trade secrets, patents, or other intellectual property rights.
          </li>
          <li>
            If your Country of Residence is not the United States, you and we may assert claims, if they qualify,
            through the small claims process in the courts of your Country of Residence. Further, as applicable, this
            agreement to arbitrate does not deprive you of the protection of the mandatory provisions of the consumer
            protection laws in your Country of Residence; you shall retain any such rights and this agreement to
            arbitrate shall be construed accordingly.
          </li>
        </ul>
        <p>
          Except as otherwise required by applicable law or provided in these Terms, in the event that the agreement to
          arbitrate is found not to apply to you or your Dispute, you and we agree that any judicial proceeding may only
          be brought in a court of competent jurisdiction in the city and state of New York. Both you and we consent to
          venue and personal jurisdiction in any such court. Notwithstanding the foregoing, either party may bring any
          action to enforce its intellectual property rights or confirm an arbitral award in any court or administrative
          agency having jurisdiction.
        </p>
        <p>
          This agreement to arbitrate shall survive the termination or expiration of these Terms. With the exception of
          the provisions of this agreement to arbitrate that prohibit Collective Arbitration, if a court decides that
          any part of this agreement to arbitrate is invalid or unenforceable, then the remaining portions of this
          agreement to arbitrate shall nevertheless remain valid and in force. If a court finds the prohibition of
          Collective Arbitration to be invalid or unenforceable, then the entirety of this agreement to arbitrate shall
          be deemed void (but no provisions of these Terms not specifically related to arbitration shall be void), and
          any remaining Dispute must be litigated in court pursuant to the preceding paragraph.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" heading="Governing law">
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the state of New Jersey
          applicable to contracts entered into and performed in New Jersey by residents thereof; provided that all
          provisions hereof related to arbitration shall be governed by and construed in accordance with the Federal
          Arbitration Act (U.S. Code Title 9).
        </p>
      </LegalSection>

      <LegalSection id="limitation-of-liability" heading="Exclusion of damages and limitation of liability">
        <p>
          In no event shall we, our affiliates, partners, service providers, or licensors, or our or their respective
          directors, shareholders, members, officers, employees, agents, or representatives, be liable under these Terms
          or otherwise to you in connection with the site, any use of it, or your submissions or anyone else’s, for: (i)
          any amounts, in the aggregate, greater than $1,000 or (ii) any lost profits or any special, incidental,
          indirect, consequential, exemplary, or punitive damages, in either case whether based in contract, tort
          (including but not limited to negligence), strict liability, or otherwise, even if our authorized
          representative had been advised of, or knew of, or should have known of, the likelihood of such damages.
        </p>
      </LegalSection>

      <LegalSection id="no-waiver" heading="No waiver">
        <p>
          If you breach these Terms and we do not immediately respond, or we do not respond at all, we will still be
          entitled to all rights and remedies at any later date, or in any other situation where you breach these Terms.
          No failure to act or delay in acting by us will be deemed to be a waiver of any type.
        </p>
      </LegalSection>

      <LegalSection id="assignment" heading="Assignment">
        <p>
          You may not assign, sub-license, or otherwise transfer any of your rights under these Terms. We may assign
          these Terms at any time, in our sole and absolute discretion, without notice.
        </p>
      </LegalSection>

      <LegalSection id="enforceability" heading="Enforceability">
        <p>
          Except as provided above with respect to the provisions of these Terms prohibiting Collective Arbitration, if
          any provision of these Terms is held to be invalid, ineffective, or unenforceable by a court of competent
          jurisdiction or arbitrator, the remaining provisions of these Terms will remain valid, effective, and
          enforceable.
        </p>
      </LegalSection>

      <LegalSection id="entire-agreement" heading="Entire agreement">
        <p>
          These Terms, together with our <Link to="/privacy">Privacy Policy</Link> and any documents incorporated into
          them by reference, constitute the entire agreement between you and us regarding the site and your use of it.
          Any prior agreement, oral or written, regarding the site is replaced by these Terms.
        </p>
      </LegalSection>

      <LegalSection id="contact" heading="Contact us">
        <p>
          If you have any questions about these Terms, contact us at{' '}
          <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>, or by mail at {LEGAL_ENTITY}, {LEGAL_ADDRESS}.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
