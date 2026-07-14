import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const APP_NAME = 'Screenshot Shield';
const APP_ID = 'io.github.youngsplace.screenshotshield';
const VERSION = '1.0.0';
const BASE_URL = 'https://youngsplace.github.io/screenshot-shield/';
const ALLOWED_PLATFORM_STATES = [
  'planned',
  'lock-approved',
  'spike-passed',
  'built-uncredentialed',
  'signed',
  'uploaded-processing',
  'internal-or-closed',
  'submitted',
  'approved-not-published',
  'production-available',
  'halted',
  'removed',
  'remediation-building',
] as const;

type ListingLocale = Record<string, string>;
type AppleMetadata = {
  schemaVersion: number;
  app: { name: string; bundleId: string; version: string };
  appleCharacterLimits: Record<string, number>;
  releaseEvidence: Record<string, unknown>;
  locales: Record<string, ListingLocale>;
};
type PlayMetadata = {
  schemaVersion: number;
  preparationStatus: string;
  app: { name: string; packageId: string; version: string; publicBaseUrl: string };
  globalContact: { privacyPolicyUrl: string; supportWebsiteUrl: string };
  playLimits: Record<string, number>;
  locales: Record<string, ListingLocale>;
};
type ApplePrivacy = {
  schemaVersion: number;
  documentType: string;
  dataCollection: boolean;
  tracking: boolean;
  linkedDataTypes: unknown[];
  unlinkedDataTypes: unknown[];
  privacyChoicesUrl: string;
  privacyPolicyUrls: Record<string, string>;
};
type PlaySafety = {
  schemaVersion: number;
  documentType: string;
  preparationStatus: string;
  app: { name: string; packageId: string; version: string };
  globalUrls: { privacyPolicyUrl: string; supportWebsiteUrl: string };
  dataSafety: {
    collectsUserData: boolean;
    sharesUserData: boolean;
    specificUserActionException: { applies: boolean; description: string };
    dataEncryptedInTransit: { applicable: boolean; reason: string };
    hasAds: boolean;
    accountRequired: boolean;
    appAccess: string;
  };
  privacyBoundary: Record<string, boolean | string>;
  consoleVerification: string;
};
type PlatformReleasePlan = {
  state: string;
  haltReason: null;
  counter: { name: string; value: number; mustAdvanceIndependently: boolean };
  toolchainEvidence: null;
  physicalGateEvidence: null;
  unsignedCandidateEvidence: null;
  signedArtifactEvidence: null;
  processingEvidence: null;
  cohortEvidence: null;
  reviewEvidence: null;
  publicationEvidence: null;
  availabilityEvidence: null;
  observation: {
    state: string;
    startedAtUtc: null;
    completedAtUtc: null;
    minimumHours: number;
    evidence: null;
    finalDisposition: null;
  };
  rollback: {
    readinessVerified: boolean;
    readinessEvidence: null;
    executionRequired: boolean;
    removalReceipt: null;
    remediationBuildEvidence: null;
  };
};
type ReleasePlan = {
  schemaVersion: number;
  documentType: string;
  aggregateClosure: { state: string; allowedStates: string[]; closedAtUtc: null; evidence: null };
  allowedPlatformStates: string[];
  release: { tag: string; version: string };
  identifiers: {
    applicationName: string;
    iosBundleIdentifier: string;
    androidApplicationId: string;
    urlScheme: string;
    publicBaseUrl: string;
  };
  source: { sourceCommit: null; releaseCommit: null };
  platforms: { ios: PlatformReleasePlan; android: PlatformReleasePlan };
  cohortRequirements: {
    minimumDurationHoursPerPlatform: number;
    minimumSyntheticRunsPerPlatform: number;
    minimumNamedPhysicalDevicesPerPlatform: number;
    maximumP0: number;
    maximumP1: number;
    maximumUnresolvedPrivacyWarnings: number;
  };
  publicationPolicy: {
    percentageRollout: string;
    automaticPublication: boolean;
    minimumPublicObservationHoursPerPlatform: number;
  };
  privacy: Record<string, boolean | string>;
  credentialsStoredInGit: boolean;
};
type CohortTemplate = {
  schemaVersion: number;
  isCompletedEvidence: boolean;
  globalRequirements: {
    minimumDurationHoursPerPlatform: number;
    minimumCompletedRunsPerPlatform: number;
    minimumDistinctNamedPhysicalDevicesPerPlatform: number;
    maximumP0PerPlatform: number;
    maximumP1PerPlatform: number;
    maximumUnresolvedPrivacyWarningsPerPlatform: number;
    flow: string[];
    handoffRule: string;
  };
  platforms: Record<
    'ios' | 'android',
    {
      cohort: {
        membershipEvidence: null;
        startedAtUtc: null;
        completedAtUtc: null;
        durationHours: null;
        physicalDeviceNames: unknown[];
        completedRuns: null;
        runRecords: unknown[];
      };
      issues: {
        p0Count: null;
        p1Count: null;
        unresolvedPrivacyWarningCount: null;
      };
      goDecision: { decision: string; namedApprover: null; decidedAtUtc: null; evidence: null };
    }
  >;
  runRecordSchema: { allowedExplicitActions: string[]; receiverOutcome: string };
};
type PublicationTemplate = {
  schemaVersion: number;
  isCompletedEvidence: boolean;
  requirements: {
    minimumCohortHoursPerPlatform: number;
    minimumSyntheticRunsPerPlatform: number;
    minimumNamedPhysicalDevicesPerPlatform: number;
    minimumPublicObservationHoursPerPlatform: number;
    version100PercentageRollout: string;
  };
  platforms: Record<
    'ios' | 'android',
    {
      counter: { name: string; value: null; evidence: null };
      artifacts: {
        unsignedCandidate: { sha256: null; inspectionEvidence: null };
        signedDistribution: {
          derivedFromUnsignedSha256: null;
          sha256: null;
          signingFingerprintSha256: null;
          inspectionEvidence: null;
        };
      };
      storeProcessing: { signedArtifactSha256: null; buildId: null; evidence: null };
      gateDecisions: Record<
        string,
        { decision: string; namedApprover: null; decidedAtUtc: null; evidence: null }
      >;
      review: { decision: string; submissionId: null; evidence: null };
      publication: { percentageRollout: null; consoleEvidence: null; cleanInstallEvidence: null };
      observation: {
        owner: null;
        startedAtUtc: null;
        checkpoints: Record<
          string,
          {
            status: string;
            checkedAtUtc: null;
            evidence: null;
            incidents: unknown[];
            disposition: null;
          }
        >;
        completedAtUtc: null;
        finalDisposition: null;
      };
      rollback: {
        readiness: {
          verified: boolean;
          removalProcedureEvidence: null;
          higherBuildPlanEvidence: null;
        };
        execution: { required: boolean; executed: boolean; removalReceipt: null };
        remediation: { required: boolean; higherBuildCounter: null; artifactEvidence: null };
      };
    }
  >;
  artifactLinkRule: string;
  decisionRule: string;
  observationRule: string;
  rollbackRule: string;
};

function json<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function text(path: string): string {
  return readFileSync(path, 'utf8');
}

function characters(value: string): number {
  return Array.from(value).length;
}

function expectExactUrls(
  locales: Record<string, ListingLocale>,
  mapping: Record<string, string>,
  privacyField: string,
  supportField: string,
): void {
  for (const [locale, queryLocale] of Object.entries(mapping)) {
    expect(locales[locale][privacyField]).toBe(`${BASE_URL}privacy.html?lang=${queryLocale}`);
    expect(locales[locale][supportField]).toBe(`${BASE_URL}support.html?lang=${queryLocale}`);
  }
}

describe('credential-free store readiness artifacts', () => {
  it('keeps all localized listing copy complete, bounded, and inside the v1 contract', () => {
    const apple = json<AppleMetadata>('store/app-store/metadata.json');
    const play = json<PlayMetadata>('store/google-play/metadata.json');

    expect(apple.schemaVersion).toBe(1);
    expect(apple.app).toEqual(
      expect.objectContaining({ name: APP_NAME, bundleId: APP_ID, version: VERSION }),
    );
    expect(Object.keys(apple.locales).sort()).toEqual(['en-US', 'ko', 'zh-Hans']);
    expectExactUrls(
      apple.locales,
      { ko: 'ko', 'en-US': 'en', 'zh-Hans': 'zh-CN' },
      'privacyPolicyUrl',
      'supportUrl',
    );
    for (const locale of Object.values(apple.locales)) {
      expect(characters(locale.appName)).toBeLessThanOrEqual(apple.appleCharacterLimits.name);
      expect(characters(locale.subtitle)).toBeLessThanOrEqual(apple.appleCharacterLimits.subtitle);
      expect(characters(locale.promotionalText)).toBeLessThanOrEqual(
        apple.appleCharacterLimits.promotionalText,
      );
      expect(characters(locale.keywords)).toBeLessThanOrEqual(apple.appleCharacterLimits.keywords);
      expect(characters(locale.description)).toBeLessThanOrEqual(
        apple.appleCharacterLimits.description,
      );
      expect(characters(locale.releaseNotes)).toBeLessThanOrEqual(
        apple.appleCharacterLimits.releaseNotes,
      );
    }
    expect(apple.releaseEvidence.status).toBe('prepared-not-submitted');
    expect(
      Object.entries(apple.releaseEvidence)
        .filter(([key]) => key !== 'status')
        .every(([, value]) => value === null),
    ).toBe(true);

    expect(play.schemaVersion).toBe(1);
    expect(play.preparationStatus).toMatch(/not evidence/i);
    expect(play.app).toEqual(
      expect.objectContaining({
        name: APP_NAME,
        packageId: APP_ID,
        version: VERSION,
        publicBaseUrl: BASE_URL,
      }),
    );
    expect(Object.keys(play.locales).sort()).toEqual(['en-US', 'ko-KR', 'zh-CN']);
    expectExactUrls(
      play.locales,
      { 'ko-KR': 'ko', 'en-US': 'en', 'zh-CN': 'zh-CN' },
      'privacyPolicyUrl',
      'supportContactUrl',
    );
    for (const locale of Object.values(play.locales)) {
      expect(characters(locale.title)).toBeLessThanOrEqual(play.playLimits.titleMaxCharacters);
      expect(characters(locale.shortDescription)).toBeLessThanOrEqual(
        play.playLimits.shortDescriptionMaxCharacters,
      );
      expect(characters(locale.fullDescription)).toBeLessThanOrEqual(
        play.playLimits.fullDescriptionMaxCharacters,
      );
      expect(characters(locale.releaseNotes)).toBeLessThanOrEqual(
        play.playLimits.releaseNotesMaxCharacters,
      );
    }

    const listingCopy = `${JSON.stringify(apple.locales)}\n${JSON.stringify(play.locales)}`;
    expect(listingCopy).not.toMatch(
      /CamScanner|document scanner|scan documents|PDF export|advertising SDK/i,
    );
  });

  it('encodes the exact Apple privacy and Play Data safety answers', () => {
    const apple = json<ApplePrivacy>('store/app-store/privacy.json');
    const play = json<PlaySafety>('store/google-play/data-safety.json');

    expect(apple).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        documentType: 'apple-app-privacy-answers',
        dataCollection: false,
        tracking: false,
        linkedDataTypes: [],
        unlinkedDataTypes: [],
        privacyChoicesUrl: '',
      }),
    );
    expect(apple.privacyPolicyUrls).toEqual({
      ko: `${BASE_URL}privacy.html?lang=ko`,
      'en-US': `${BASE_URL}privacy.html?lang=en`,
      'zh-Hans': `${BASE_URL}privacy.html?lang=zh-CN`,
    });

    expect(play.schemaVersion).toBe(1);
    expect(play.documentType).toBe('google-play-data-safety-answers');
    expect(play.preparationStatus).toMatch(/not evidence/i);
    expect(play.app).toEqual({ name: APP_NAME, packageId: APP_ID, version: VERSION });
    expect(play.globalUrls).toEqual({
      privacyPolicyUrl: `${BASE_URL}privacy.html?lang=en`,
      supportWebsiteUrl: `${BASE_URL}support.html?lang=en`,
    });
    expect(play.dataSafety).toEqual(
      expect.objectContaining({
        collectsUserData: false,
        sharesUserData: false,
        hasAds: false,
        accountRequired: false,
      }),
    );
    expect(play.dataSafety.specificUserActionException).toEqual(
      expect.objectContaining({ applies: true }),
    );
    expect(play.dataSafety.specificUserActionException.description).toMatch(
      /explicitly chooses Share|specific-user-action/i,
    );
    expect(play.dataSafety.dataEncryptedInTransit).toEqual(
      expect.objectContaining({ applicable: false }),
    );
    expect(play.dataSafety.appAccess).toMatch(/without an account/i);
    expect(play.privacyBoundary).toEqual(
      expect.objectContaining({
        backend: false,
        analytics: false,
        telemetry: false,
        crashReportingEgress: false,
        tracking: false,
        remoteOcr: false,
      }),
    );
    expect(play.consoleVerification).toMatch(/named human|mismatch is a hold/i);
  });

  it('keeps v1.0.0 provenance in truthful independent planned lifecycles', () => {
    const release = json<ReleasePlan>('releases/v1.0.0.json');

    expect(release.schemaVersion).toBe(2);
    expect(release.documentType).toBe('screenshot-shield-release-plan');
    expect(release.aggregateClosure).toEqual(
      expect.objectContaining({
        state: 'open-planned',
        allowedStates: ['open-planned', 'blocked', 'evidence-complete'],
        closedAtUtc: null,
        evidence: null,
      }),
    );
    expect(release.allowedPlatformStates).toEqual(ALLOWED_PLATFORM_STATES);
    expect(release.release).toEqual(expect.objectContaining({ tag: 'v1.0.0', version: VERSION }));
    expect(release.identifiers).toEqual({
      applicationName: APP_NAME,
      iosBundleIdentifier: APP_ID,
      androidApplicationId: APP_ID,
      urlScheme: 'screenshotshield',
      publicBaseUrl: BASE_URL,
    });
    expect(release.source).toEqual(
      expect.objectContaining({ sourceCommit: null, releaseCommit: null }),
    );
    expect(release.credentialsStoredInGit).toBe(false);

    const platforms = Object.entries(release.platforms) as [
      'ios' | 'android',
      PlatformReleasePlan,
    ][];
    expect(release.platforms.ios.counter.name).toBe('CFBundleVersion');
    expect(release.platforms.android.counter.name).toBe('versionCode');
    for (const [platformName, platform] of platforms) {
      expect(platformName).toMatch(/^(ios|android)$/);
      expect(platform.state).toBe('planned');
      expect(platform.haltReason).toBeNull();
      expect(platform.counter.value).toBe(1);
      expect(platform.counter.mustAdvanceIndependently).toBe(true);
      expect(platform.toolchainEvidence).toBeNull();
      expect(platform.physicalGateEvidence).toBeNull();
      expect(platform.unsignedCandidateEvidence).toBeNull();
      expect(platform.signedArtifactEvidence).toBeNull();
      expect(platform.processingEvidence).toBeNull();
      expect(platform.cohortEvidence).toBeNull();
      expect(platform.reviewEvidence).toBeNull();
      expect(platform.publicationEvidence).toBeNull();
      expect(platform.availabilityEvidence).toBeNull();
      expect(platform.observation).toEqual(
        expect.objectContaining({
          state: 'not-started',
          startedAtUtc: null,
          completedAtUtc: null,
          minimumHours: 72,
          evidence: null,
          finalDisposition: null,
        }),
      );
      expect(platform.rollback).toEqual({
        readinessVerified: false,
        readinessEvidence: null,
        executionRequired: false,
        removalReceipt: null,
        remediationBuildEvidence: null,
      });
    }

    expect(release.cohortRequirements).toEqual({
      minimumDurationHoursPerPlatform: 48,
      minimumSyntheticRunsPerPlatform: 20,
      minimumNamedPhysicalDevicesPerPlatform: 3,
      maximumP0: 0,
      maximumP1: 0,
      maximumUnresolvedPrivacyWarnings: 0,
    });
    expect(release.publicationPolicy).toEqual(
      expect.objectContaining({
        percentageRollout: 'prohibited for 1.0.0',
        automaticPublication: false,
        minimumPublicObservationHoursPerPlatform: 72,
      }),
    );
    expect(release.privacy).toEqual(
      expect.objectContaining({
        backend: false,
        account: false,
        ads: false,
        analytics: false,
        telemetry: false,
        crashEgress: false,
        tracking: false,
        remoteOcr: false,
        camera: false,
      }),
    );
    expect(release.privacy.allowedHandoff).toMatch(
      /explicit Share or prepared-output save action.*Receiver behavior is not inferred/i,
    );
  });

  it('keeps evidence templates unfilled while encoding every release gate independently', () => {
    const cohort = json<CohortTemplate>('store/evidence/internal-cohort.template.json');
    const publication = json<PublicationTemplate>('store/evidence/publication.template.json');
    const cohortText = JSON.stringify(cohort);
    const publicationText = JSON.stringify(publication);

    expect(cohort.schemaVersion).toBe(2);
    expect(cohort.isCompletedEvidence).toBe(false);
    expect(cohort.globalRequirements).toEqual(
      expect.objectContaining({
        minimumDurationHoursPerPlatform: 48,
        minimumCompletedRunsPerPlatform: 20,
        minimumDistinctNamedPhysicalDevicesPerPlatform: 3,
        maximumP0PerPlatform: 0,
        maximumP1PerPlatform: 0,
        maximumUnresolvedPrivacyWarningsPerPlatform: 0,
      }),
    );
    expect(cohort.globalRequirements.flow).toContain('explicit Share or prepared-output save');
    expect(cohort.globalRequirements.handoffRule).toMatch(
      /separate explicit product action.*Neither path proves receiver/i,
    );
    expect(cohort.runRecordSchema.allowedExplicitActions).toEqual([
      'Share',
      'prepared-output save',
    ]);
    expect(cohort.runRecordSchema.receiverOutcome).toBe('not inferred');

    for (const platform of Object.values(cohort.platforms)) {
      expect(platform.cohort).toEqual(
        expect.objectContaining({
          membershipEvidence: null,
          startedAtUtc: null,
          completedAtUtc: null,
          durationHours: null,
          physicalDeviceNames: [],
          completedRuns: null,
          runRecords: [],
        }),
      );
      expect(platform.issues).toEqual(
        expect.objectContaining({
          p0Count: null,
          p1Count: null,
          unresolvedPrivacyWarningCount: null,
        }),
      );
      expect(platform.goDecision).toEqual({
        decision: 'pending',
        namedApprover: null,
        decidedAtUtc: null,
        evidence: null,
      });
    }

    expect(publication.schemaVersion).toBe(2);
    expect(publication.isCompletedEvidence).toBe(false);
    expect(publication.requirements).toEqual(
      expect.objectContaining({
        minimumCohortHoursPerPlatform: 48,
        minimumSyntheticRunsPerPlatform: 20,
        minimumNamedPhysicalDevicesPerPlatform: 3,
        minimumPublicObservationHoursPerPlatform: 72,
        version100PercentageRollout: 'prohibited',
      }),
    );

    const expectedGateNames = [
      'cohort',
      'physicalToolchain',
      'protectedSigning',
      'publication',
      'review',
      'uploadProcessing',
    ];
    for (const platform of Object.values(publication.platforms)) {
      expect(platform.counter.value).toBeNull();
      expect(platform.counter.evidence).toBeNull();
      expect(platform.artifacts.unsignedCandidate).toEqual(
        expect.objectContaining({ sha256: null, inspectionEvidence: null }),
      );
      expect(platform.artifacts.signedDistribution).toEqual(
        expect.objectContaining({
          derivedFromUnsignedSha256: null,
          sha256: null,
          signingFingerprintSha256: null,
          inspectionEvidence: null,
        }),
      );
      expect(platform.storeProcessing).toEqual(
        expect.objectContaining({ signedArtifactSha256: null, buildId: null, evidence: null }),
      );
      expect(Object.keys(platform.gateDecisions).sort()).toEqual(expectedGateNames);
      for (const decision of Object.values(platform.gateDecisions)) {
        expect(decision).toEqual({
          decision: 'pending',
          namedApprover: null,
          decidedAtUtc: null,
          evidence: null,
        });
      }
      expect(platform.review).toEqual(
        expect.objectContaining({ decision: 'pending', submissionId: null, evidence: null }),
      );
      expect(platform.publication).toEqual(
        expect.objectContaining({
          percentageRollout: null,
          consoleEvidence: null,
          cleanInstallEvidence: null,
        }),
      );
      expect(Object.keys(platform.observation.checkpoints)).toEqual([
        'hour0',
        'hour24',
        'hour48',
        'hour72',
      ]);
      expect(platform.observation.owner).toBeNull();
      expect(platform.observation.startedAtUtc).toBeNull();
      for (const checkpoint of Object.values(platform.observation.checkpoints)) {
        expect(checkpoint).toEqual({
          status: 'pending',
          checkedAtUtc: null,
          evidence: null,
          incidents: [],
          disposition: null,
        });
      }
      expect(platform.observation.completedAtUtc).toBeNull();
      expect(platform.observation.finalDisposition).toBeNull();
      expect(platform.rollback.readiness).toEqual({
        verified: false,
        removalProcedureEvidence: null,
        higherBuildPlanEvidence: null,
      });
      expect(platform.rollback.execution).toEqual(
        expect.objectContaining({ required: false, executed: false, removalReceipt: null }),
      );
      expect(platform.rollback.remediation).toEqual(
        expect.objectContaining({
          required: false,
          higherBuildCounter: null,
          artifactEvidence: null,
        }),
      );
    }

    expect(publication.artifactLinkRule).toMatch(/signedDistribution SHA-256/i);
    expect(publication.decisionRule).toMatch(/each physical\/toolchain.*publication gate/i);
    expect(publication.observationRule).toMatch(/0\/24\/48\/72-hour.*missing is not passed/i);
    expect(publication.rollbackRule).toMatch(
      /Readiness is mandatory.*Execution receipts are required only when rollback is triggered/i,
    );
    for (const artifact of [cohortText, publicationText]) {
      expect(artifact).not.toMatch(/\b[0-9a-f]{64}\b/i);
    }
  });

  it('provides operational review, release, observation, and rollback instructions without credentials', () => {
    const documents = [
      text('store/app-store/review-notes.md'),
      text('store/google-play/review-notes.md'),
      text('docs/native-release-runbook.md'),
      text('docs/rollback-and-observation.md'),
    ].join('\n');

    expect(documents).toMatch(/synthetic/i);
    expect(documents).toMatch(/48 (?:elapsed )?hours|48-hour/i);
    expect(documents).toMatch(/20 (?:completed )?runs|20-run/i);
    expect(documents).toMatch(/three distinct|at least three|3 named/i);
    expect(documents).toMatch(/72 (?:elapsed )?hours|72-hour/i);
    expect(documents).toMatch(/percentage rollout is prohibited/i);
    expect(documents).toMatch(/installed users cannot be downgraded/i);
    expect(documents).toMatch(/higher build/i);
    expect(documents).toMatch(/not evidence|pending|planned/i);
    expect(documents).not.toMatch(/BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/);
    expect(documents).not.toMatch(/sk_live_[A-Za-z0-9_-]+|AKIA[0-9A-Z]{16}/);
  });
});
