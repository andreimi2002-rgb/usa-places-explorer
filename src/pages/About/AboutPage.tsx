import { PageHeader } from '../../components/ui/layout-primitives';
import { Seo } from '../../components/ui/Seo';
import { VerificationBadge } from '../../components/ui/VerificationBadge';

export function AboutPage() {
  return (
    <>
      <Seo
        title="About"
        description="Why USA Places Explorer exists, how facts are verified, and how images are sourced and licensed."
      />
      <PageHeader
        eyebrow="About"
        title="An atlas of everyday and extraordinary America"
        intro={
          <p>
            Most guides list individual attractions. This project explains the kinds of places the
            United States is built from and the brands that shape them, then documents real examples.
          </p>
        }
      />

      <div className="container-page grid gap-12 py-section lg:grid-cols-[1fr_2fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-2 border-l border-line pl-4 text-small">
            <li><a href="#purpose" className="link">Purpose</a></li>
            <li><a href="#principles" className="link">Data principles</a></li>
            <li><a href="#verification" className="link">How verification works</a></li>
            <li><a href="#images" className="link">Image licensing</a></li>
            <li><a href="#maps" className="link">Maps</a></li>
          </ul>
        </nav>

        <div className="prose-atlas space-y-12">
          <section aria-labelledby="purpose">
            <h2 id="purpose" className="font-sans text-h3">Purpose</h2>
            <p className="mt-3">
              A Texas travel center, a Florida retirement community, a Route 66 motel and a Pacific
              seaport are all part of how the country works. Most of them are never written about
              as a <em>kind</em> of place. USA Places Explorer has three layers: place types, which
              explain a format; brands, which explain the companies behind recognizable places; and
              individual places, which document real locations.
            </p>
            <p>
              This is not a travel guide or a review site. It does not list opening hours, phone
              numbers or ratings. For those, go to each place's official website.
            </p>
          </section>

          <section aria-labelledby="principles">
            <h2 id="principles" className="font-sans text-h3">Data principles</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Nothing is invented. Every factual field comes from a source we actually checked.</li>
              <li>
                Sources are preferred in this order: the official website, then Wikidata, then
                Wikipedia, then reputable news coverage.
              </li>
              <li>If a fact could not be verified, it is left blank and marked as not yet verified.</li>
              <li>Every number carries its source and an "as of" date.</li>
              <li>Map markers appear only where coordinates have been verified.</li>
              <li>All descriptions are written for this project, not copied from other sites.</li>
            </ul>
          </section>

          <section aria-labelledby="verification">
            <h2 id="verification" className="font-sans text-h3">How verification works</h2>
            <p className="mt-3">Every record carries one of three statuses, with the date it was last checked:</p>
            <dl className="mt-4 space-y-4 font-sans text-body">
              <div>
                <dt><VerificationBadge status="verified" /></dt>
                <dd className="mt-1 text-ink-muted">Every factual field shown has been checked against a cited source.</dd>
              </div>
              <div>
                <dt><VerificationBadge status="partial" /></dt>
                <dd className="mt-1 text-ink-muted">Core facts are checked; some fields are still blank pending a reliable source.</dd>
              </div>
              <div>
                <dt><VerificationBadge status="unverified" /></dt>
                <dd className="mt-1 text-ink-muted">The record exists but its details have not been confirmed yet.</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="images">
            <h2 id="images" className="font-sans text-h3">Image licensing</h2>
            <p className="mt-3">
              Photographs come from Wikimedia Commons and are used under their free licenses, such as
              Creative Commons Attribution, Attribution-ShareAlike or public domain. Each image is
              credited next to where it appears, with the author, the license and a link to its
              Commons file page. We only use an image that clearly shows the specific place on the
              page. Where none exists, a "Photo needed" placeholder is shown instead.
            </p>
          </section>

          <section aria-labelledby="maps">
            <h2 id="maps" className="font-sans text-h3">Maps</h2>
            <p className="mt-3">
              Maps use OpenStreetMap tiles, &copy; OpenStreetMap contributors, available under the
              Open Database License.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
