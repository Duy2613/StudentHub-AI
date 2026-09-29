# Frontend UI/UX Code Inventory — StudentHub AI

Cập nhật: 2026-09-24  
Phạm vi: mã runtime giao diện trong frontend/src/app và frontend/src/components, cùng những module frontend trực tiếp điều khiển điều hướng, trạng thái UI, xác thực, API client và media.

## Tổng quan

- 46 file page.* tạo route giao diện trong App Router.
- 53 file UI/runtime trong frontend/src/app khi tính thêm layout, trạng thái lỗi và stylesheet theo route (không tính favicon).
- 304 file dưới frontend/src/components (bao gồm JSX, CSS module, media coordinator và dữ liệu visual).
- 6 stylesheet trong frontend/src.
- 165 file tài nguyên trong frontend/public; đây là ảnh/video/font/đồ họa, không phải code.
- API handlers frontend/src/app/api/**/route.* và phần lớn frontend/src/lib/server/** là backend/data contract, không phải mã dựng giao diện nên không đưa vào danh mục component. Chỉ sửa chúng nếu thiết kế cần đổi hợp đồng dữ liệu/trạng thái.

## Cách lần từ một màn hình tới giao diện

    frontend/src/app/layout.tsx
      ├─ global CSS, font, providers, notification, cursor/ambience
      ├─ route page (frontend/src/app/**/page.jsx)
      ├─ shell/navigation dùng chung
      └─ component theo tính năng (frontend/src/components/<domain>/**)

### Các entry point nên mở đầu khi thiết kế lại luồng sản phẩm chính

| Màn hình | Entry point hiện tại | Thành phần dựng màn hình |
|---|---|---|
| Trang chủ / | frontend/src/app/page.jsx | frontend/src/components/landing/EvidenceWorldLanding.jsx, điều phối nhóm cinematic/*, ui/HobroTelemetryMarquee.jsx |
| Kiểm chứng /trust | frontend/src/app/trust/page.jsx | frontend/src/components/layout/UnifiedAppShell.jsx + frontend/src/components/trust/TrustWorkspaceClient.jsx |
| Cộng đồng /community | frontend/src/app/community/page.jsx | UnifiedAppShell + community/CommunityWorkspaceClient.jsx |
| Chi tiết bài cộng đồng | frontend/src/app/community/[postId]/page.jsx | UnifiedAppShell + community/CommunityDetailWorkspace.jsx |
| Chuyên gia /expert | frontend/src/app/expert/page.jsx | UnifiedAppShell + expert/ExpertWorkspaceClient.jsx |
| Hồ sơ chuyên gia | frontend/src/app/expert/profile/page.jsx, frontend/src/app/expert/profile/[expertId]/page.jsx | expert/ExpertProfileWorkspace.jsx, expert/ExpertPublicProfileWorkspace.jsx |
| Hồ sơ bằng chứng /cases | frontend/src/app/cases/page.jsx | UnifiedAppShell + competition/CompetitionCaseStudio.jsx |
| Tổng quan /dashboard | frontend/src/app/dashboard/page.jsx | StudentHubOSShell + home/CommandCenterDashboard.jsx |
| Học vụ /academic/... | frontend/src/app/academic/[[...slug]]/page.jsx | StudentHubOSShell + academic/AcademicWorkspace.jsx |
| Xác thực / thiết lập | login/page.jsx, register/page.jsx, onboarding/page.jsx, callback/page.jsx | auth/*, lib/auth/* |
| Cài đặt | settings/page.jsx, settings/privacy/page.jsx | settings/*, các app shell |
| Showcase thử nghiệm /ultra | ultra/page.jsx, ultra/layout.jsx | components/ultra/*, stylesheet riêng ultra/ultra.css |

### Lớp giao diện toàn cục và điều hướng

- frontend/src/app/layout.tsx: font tiếng Việt/hiển thị/kỹ thuật, metadata, providers và các thành phần global; đây là điểm ảnh hưởng đồng thời mọi route.
- frontend/src/app/globals.css: Tailwind v4, token màu/bề mặt/chữ/chuyển động và CSS toàn sản phẩm.
- frontend/src/components/navigation/PrimaryNavbar.jsx, MobileNavRail.jsx: điều hướng toàn cục tương thích.
- frontend/src/components/layout/UnifiedAppShell.jsx: shell chính cho Trust, Community, Expert, Cases, Dashboard và một số màn hình tài khoản; gồm header, menu mobile, search/command palette, ngữ cảnh và tài khoản.
- frontend/src/components/layout/StudentHubOSShell.jsx, GlobalAppShell.jsx, AcademicNavbar.jsx, ModernNavbar.jsx, CollapsibleSidebar.jsx: shell/navbar/sidebar của các vùng khác.
- frontend/src/components/layout/navigationConfig.js, referenceRouteConfig.js: cấu hình nhóm điều hướng và profile bề mặt route.
- frontend/src/components/providers/*, frontend/src/components/visual/*, frontend/src/components/cinematic/*: ambient, realtime, chất lượng thiết bị, cuộn, reduced motion, chuyển động và lớp visual dùng xuyên nhiều màn hình.
- frontend/src/components/command/*, frontend/src/components/realtime/*: command palette, console và notification ảnh hưởng trực tiếp tới thao tác người dùng.

## Danh sách route source trong App Router

Các file page/layout/error/styles hiện có ngoài src/app/api/**:
- academic-showcase\page.jsx
- academic\[[...slug]]\page.jsx
- ai\page.jsx
- c9\page.jsx
- callback\page.jsx
- cases\page.jsx
- cinema\page.jsx
- community\[postId]\page.jsx
- community\page.jsx
- credit-scheduler\page.jsx
- dashboard\page.jsx
- error.jsx
- expert\page.jsx
- expert\profile\[expertId]\page.jsx
- expert\profile\page.jsx
- forum\page.jsx
- global-error.jsx
- globals.css
- intelligence\ai-trust\page.jsx
- intelligence\community\page.jsx
- intelligence\evidence\page.jsx
- intelligence\experts\page.jsx
- intelligence\knowledge\page.jsx
- intelligence\page.jsx
- intelligence\trust\page.jsx
- layout.tsx
- learn\[courseId]\[lessonId]\page.jsx
- learn\page.jsx
- login\page.jsx
- marketplace\page.jsx
- not-found.jsx
- onboarding\page.jsx
- page.jsx
- practice\page.jsx
- prof-rating\page.jsx
- profile\[id]\page.jsx
- profile\page.jsx
- projects\page.jsx
- quests\page.jsx
- register\page.jsx
- roadmap\page.jsx
- safety-map\page.jsx
- scam-check\page.jsx
- scholarships\page.jsx
- settings\page.jsx
- settings\privacy\page.jsx
- sos\page.jsx
- trust\page.jsx
- tuition-radar\page.jsx
- ultra\layout.jsx
- ultra\page.jsx
- ultra\ultra.css
- verify\page.jsx

## Danh mục component UI/UX đầy đủ

Đường dẫn bên dưới tính từ frontend/src/components/. Danh mục gồm component trực quan, component tính năng, trạng thái tương tác và CSS module.

### academic (11 file)

- academic\AcademicExecutionCenterView.jsx
- academic\AcademicRoadmapView.jsx
- academic\AcademicStates.jsx
- academic\AcademicSummaryWidget.jsx
- academic\AcademicWhatIfPlannerView.jsx
- academic\AcademicWorkspace.jsx
- academic\DigitalTwinDrawer.jsx
- academic\FacultyRubricModal.jsx
- academic\MilestoneDetailDrawer.jsx
- academic\NotificationCenterDrawer.jsx
- academic\Profile360View.jsx

### academic-showcase (17 file)

- academic-showcase\AcademicAdvisoryDrawer.jsx
- academic-showcase\AcademicAudioEngine.jsx
- academic-showcase\AcademicCinemaTheater.jsx
- academic-showcase\AcademicFeatureBackgroundMatrix.jsx
- academic-showcase\AcademicMissionBento.jsx
- academic-showcase\AcademicShowcaseFooter.jsx
- academic-showcase\AcademicTelemetryHud.jsx
- academic-showcase\AcademicTrustBar.jsx
- academic-showcase\CinematicAtmosphereVideo.jsx
- academic-showcase\CinematicHeroSection.jsx
- academic-showcase\DeviceSwitcherDock.jsx
- academic-showcase\ExpertCollective.jsx
- academic-showcase\FourStepLearningFlow.jsx
- academic-showcase\KnowledgeDomainsCatalog.jsx
- academic-showcase\MagneticKnowledgeCursor.jsx
- academic-showcase\SmartCampusTour.jsx
- academic-showcase\VerifiedOutcomes.jsx

### ai (1 file)

- ai\GroundedAIStudio.jsx

### animations (1 file)

- animations\GsapTimeline.jsx

### atlas (1 file)

- atlas\InteractiveKnowledgeAtlas.jsx

### auth (9 file)

- auth\AuthSurroundings.jsx
- auth\AuthUI.jsx
- auth\SaffronAcademicRadar.jsx
- auth\SaffronAuthContainer.jsx
- auth\SaffronAuthDeck.jsx
- auth\SaffronAuthModal.jsx
- auth\SaffronPasswordEntropy.jsx
- auth\UAvionixTelemetryHUD.jsx
- auth\UserDropdownMenu.jsx

### canvas (8 file)

- canvas\GeometricConstellationCanvas.jsx
- canvas\Hero3DCanvas.jsx
- canvas\KnowledgeUniverse3D.jsx
- canvas\knowledgeUniverseData.js
- canvas\KnowledgeUniverseFallback.jsx
- canvas\ProgressiveKnowledgeUniverse.jsx
- canvas\RobinPayotFluidCanvas.jsx
- canvas\RobinPayotRoadCanvas.jsx

### cinematic (15 file)

- cinematic\ArstraumurAtmosphereCanvas.jsx
- cinematic\CinematicPillarTrackers.jsx
- cinematic\CinematicReelStage.jsx
- cinematic\CollectiveCommunitySection.jsx
- cinematic\ExpertAuthoritySection.jsx
- cinematic\FinalClaritySection.jsx
- cinematic\HeroCinematicPorch.jsx
- cinematic\HobroPrecisionCursor.jsx
- cinematic\HobroTiltCard.jsx
- cinematic\KnowledgeAtlasSection.jsx
- cinematic\NoiseToSignalSection.jsx
- cinematic\SoundAtmosphereController.jsx
- cinematic\TrustCinematicJourney.jsx
- cinematic\VerifiedHumanAiSection.jsx
- cinematic\WhyZeroManifestoSection.jsx

### command (2 file)

- command\AcademicCommandPalette.jsx
- command\CommandPalette.jsx

### community (20 file)

- community\CommunityCinematicHero.jsx
- community\CommunityComposer.jsx
- community\CommunityContextSignalRail.jsx
- community\CommunityDetailWorkspace.jsx
- community\CommunityEditorialStory.jsx
- community\CommunityEvidenceLegendBar.jsx
- community\CommunityEvidenceWorld.jsx
- community\CommunityExperienceStudio.jsx
- community\CommunityFeed.jsx
- community\CommunityFilterRail.jsx
- community\CommunityIntelligenceStudioV2.jsx
- community\CommunityIntelligenceView.jsx
- community\CommunityPerceptionBar.jsx
- community\CommunityPostCard.jsx
- community\CommunityPrimaryActionCenter.jsx
- community\CommunityQuickPostDialog.jsx
- community\CommunitySocialWorkspace.jsx
- community\CommunityWorkspaceClient.jsx
- community\ConversationalExpertResponse.jsx
- community\ForumDiscourseDrawer.jsx

### competition (2 file)

- competition\competition-case-studio.module.css
- competition\CompetitionCaseStudio.jsx

### expert (19 file)

- expert\ExpertAuthorityNetwork.jsx
- expert\ExpertBlindReviewWidget.jsx
- expert\ExpertCinematicHero.jsx
- expert\ExpertIntelligenceStudioV2.jsx
- expert\ExpertIntelligenceView.jsx
- expert\ExpertKnowledgeGraphView.jsx
- expert\ExpertNetworkWorkspace.jsx
- expert\ExpertOperationalWorkspace.jsx
- expert\ExpertProfileWorkspace.jsx
- expert\ExpertPublicDirectory.jsx
- expert\ExpertPublicProfileWorkspace.jsx
- expert\ExpertPublicStory.jsx
- expert\ExpertQualificationPanel.jsx
- expert\ExpertQualificationWorkspace.jsx
- expert\ExpertReviewDeskModal.jsx
- expert\ExpertWorkspaceClient.jsx
- expert\FormalExpertAssessmentCard.jsx
- expert\MultiExpertDisagreementStack.jsx
- expert\ReputationMatrixCard.jsx

### fusion (1 file)

- fusion\KnowledgeObjectStudio.jsx

### home (2 file)

- home\CommandCenterDashboard.jsx
- home\Hero3DCanvas.jsx

### intelligence (10 file)

- intelligence\CommunityIntelligenceStudio.jsx
- intelligence\CommunityLensView.jsx
- intelligence\EvidenceFusionStudio.jsx
- intelligence\EvidenceLensView.jsx
- intelligence\ExpertIntelligenceStudio.jsx
- intelligence\ExpertLensView.jsx
- intelligence\GroundedRecommendationStudio.jsx
- intelligence\TrustIntelligenceStudio.jsx
- intelligence\TrustLensView.jsx
- intelligence\UnifiedIntelligenceWorkspace.jsx

### landing (32 file)

- landing\AcademicAiVerificationSection.jsx
- landing\AcademicHeroSection.jsx
- landing\AcademicSafeActionSection.jsx
- landing\AiTutorSection.jsx
- landing\CallToActionSection.jsx
- landing\CommunityExpertCouncilSection.jsx
- landing\CommunityExpertsSection.jsx
- landing\CommunityShowcaseSection.jsx
- landing\ContinueLearningBar.jsx
- landing\CoreFeaturesSection.jsx
- landing\EvidenceWorldLanding.jsx
- landing\ExpertShowcase.jsx
- landing\ExplainableEngineSection.jsx
- landing\FeaturedCoursesSection.jsx
- landing\FinalCtaSection.jsx
- landing\FullStackLayersSection.jsx
- landing\HeroSection.jsx
- landing\IglooEcosystemShowcase.jsx
- landing\InteractiveScamDemo.jsx
- landing\LandingFooter.jsx
- landing\LandingHeader.jsx
- landing\LearningDomainsSection.jsx
- landing\living-campus-atlas.module.css
- landing\LivingCampusAtlas.jsx
- landing\OutcomesSection.jsx
- landing\PracticeProjectLabSection.jsx
- landing\StudentDilemmaChatCarousel.jsx
- landing\ThreeStepTrustFlowSection.jsx
- landing\TrustEngineShowcase.jsx
- landing\VNextLanding.jsx
- landing\VNextLandingChapter.jsx
- landing\VNextLandingHero.jsx

### layout (8 file)

- layout\AcademicNavbar.jsx
- layout\CollapsibleSidebar.jsx
- layout\GlobalAppShell.jsx
- layout\ModernNavbar.jsx
- layout\navigationConfig.js
- layout\referenceRouteConfig.js
- layout\StudentHubOSShell.jsx
- layout\UnifiedAppShell.jsx

### lesson (1 file)

- lesson\LessonCompanionPanel.jsx

### margin (4 file)

- margin\Annotation.jsx
- margin\margin.css
- margin\MarginRail.jsx
- margin\Mark.jsx

### media (6 file)

- media\CinematicMediaCoordinator.js
- media\KhaiMinhImage.jsx
- media\ReferenceBirdStamp.jsx
- media\SmartVideo.jsx
- media\VerifiedPoster.jsx
- media\VNextMediaFrame.jsx

### navigation (2 file)

- navigation\MobileNavRail.jsx
- navigation\PrimaryNavbar.jsx

### primitives (6 file)

- primitives\CoordinateFrame.jsx
- primitives\EvidenceStamp.jsx
- primitives\FieldLegend.jsx
- primitives\MachineDataStrip.jsx
- primitives\MarginNote.jsx
- primitives\SignalTrace.jsx

### providers (7 file)

- providers\AdaptiveQualityContext.jsx
- providers\BackgroundContext.jsx
- providers\CinematicAmbientDock.jsx
- providers\RealtimeContext.jsx
- providers\ReferenceAtmosphere.jsx
- providers\SmoothScrollProvider.jsx
- providers\UniversalCinematicBackground.jsx

### realtime (2 file)

- realtime\RealtimeLiveConsole.jsx
- realtime\RealtimeNotificationToasts.jsx

### root (1 file)

- AvatarDisplay.jsx

### settings (5 file)

- settings\AIDriveIntegrationPanel.jsx
- settings\ConnectedSourcesManager.jsx
- settings\PersonalizationControls.jsx
- settings\PrivacyAccessCenter.jsx
- settings\PrivacyAndSecurityCenter.jsx

### social (1 file)

- social\SocialSignalRadar.jsx

### spatial (2 file)

- spatial\EvidencePrism3D.jsx
- spatial\KnowledgeAtlas3D.jsx

### trust (31 file)

- trust\AiTrustConsoleV2.jsx
- trust\AiTrustStudioView.jsx
- trust\AskExpertGatewayCard.jsx
- trust\EvidenceConstellationStage.jsx
- trust\ImageForensicsHUD.jsx
- trust\InlineCitation.jsx
- trust\Layer1BenchmarkStudio.jsx
- trust\Layer1LivePrechecker.jsx
- trust\Layer1TelemetryHUD.jsx
- trust\Layer2BenchmarkStudio.jsx
- trust\Layer2SemanticHUD.jsx
- trust\Layer3BenchmarkStudio.jsx
- trust\Layer3EvidenceHUD.jsx
- trust\Layer4BenchmarkStudio.jsx
- trust\Layer4TrustVerdictHUD.jsx
- trust\NeuralModelTelemetryHUD.jsx
- trust\OwnTrustJourney.jsx
- trust\OwnTrustJourney.module.css
- trust\PostResultGateways.jsx
- trust\RiskMeterSplitVerdict.jsx
- trust\SourceInspectorDrawer.jsx
- trust\TrustEvidenceCard.jsx
- trust\TrustForensicPipelineVisualizer.jsx
- trust\TrustGraph2D.jsx
- trust\TrustMasterUltraJourney.jsx
- trust\TrustPipelineTimeline.jsx
- trust\TrustResultSummary.jsx
- trust\TrustRunProgress.jsx
- trust\TrustSectionBoundary.jsx
- trust\TrustVsExpertComparisonMatrix.jsx
- trust\TrustWorkspaceClient.jsx

### ui (52 file)

- ui\3d-card.jsx
- ui\AeroMissionControlBackdrop.jsx
- ui\AITerminalBlock.jsx
- ui\animated-beam.jsx
- ui\animated-gradient-text.jsx
- ui\AuroraParticleCanvas.jsx
- ui\BackgroundsAndEffectsStudio.jsx
- ui\badge.jsx
- ui\border-beam.jsx
- ui\button.jsx
- ui\card.jsx
- ui\cinematic-video-atmosphere.jsx
- ui\CinematicChapterNavigator.jsx
- ui\CinematicScrollytellingObserver.jsx
- ui\CinematicTaskBackdrop.jsx
- ui\constellation-wave-canvas.jsx
- ui\ContextBar.jsx
- ui\creative-shader-canvas.jsx
- ui\custom-morphing-cursor.jsx
- ui\EvidenceStateBadge.jsx
- ui\floating-dock.jsx
- ui\floating-forcefield-orbs.jsx
- ui\HobroTelemetryMarquee.jsx
- ui\IglooAuroraDivider.jsx
- ui\IglooSoundAmbiencePill.jsx
- ui\Interactive3DBlockCard.jsx
- ui\Interactive3DWaveMonolithCapsule.jsx
- ui\KnowledgeCursor.jsx
- ui\lamp.jsx
- ui\liquid-study-reveal.jsx
- ui\live-studio-clock.jsx
- ui\meteors.jsx
- ui\MohsinCurtainTransition.jsx
- ui\MohsinFluidCanvas.jsx
- ui\number-ticker.jsx
- ui\otp-verification-orbit.jsx
- ui\page-transition-wrapper.jsx
- ui\SaffronMarqueeTicker.jsx
- ui\SaffronMohsinPerimeter3DOrbit.jsx
- ui\SaffronSwissCrosshairGrid.jsx
- ui\shimmer-button.jsx
- ui\SourceDisclosure.jsx
- ui\SparklingStardustCanvas.jsx
- ui\spotlight.jsx
- ui\StateBoundary.jsx
- ui\TactileButton.jsx
- ui\text-reveal.jsx
- ui\TextScramble.jsx
- ui\tracing-beam.jsx
- ui\VNextButton.jsx
- ui\VNextSurface.jsx
- ui\word-rotate.jsx

### ultra (17 file)

- ultra\sections\UltraChapterNav.jsx
- ultra\sections\UltraEffectsGallery.jsx
- ultra\sections\UltraFeatureAtlas.jsx
- ultra\sections\UltraHeroSection.jsx
- ultra\sections\UltraPerformanceLab.jsx
- ultra\sections\UltraThemeShowcase.jsx
- ultra\UltraChrome.jsx
- ultra\UltraCommandPalette.jsx
- ultra\UltraCursor.jsx
- ultra\UltraHeroScene.jsx
- ultra\UltraKeyboardRouter.jsx
- ultra\UltraMagneticCard.jsx
- ultra\UltraMotionKit.jsx
- ultra\UltraProvider.jsx
- ultra\UltraSitemapOrbit.jsx
- ultra\UltraThemeStudio.jsx
- ultra\UltraToastHub.jsx

### visual (8 file)

- visual\AmbientField.jsx
- visual\EvidencePrismHero.jsx
- visual\LivingKnowledgeCore.jsx
- visual\MagneticTarget.jsx
- visual\ReducedMotionBoundary.jsx
- visual\Reveal.jsx
- visual\TracePath.jsx
- visual\VisualSurface.jsx

## Stylesheet
- frontend/src\app\globals.css
- frontend/src\app\ultra\ultra.css
- frontend/src\components\competition\competition-case-studio.module.css
- frontend/src\components\landing\living-campus-atlas.module.css
- frontend/src\components\margin\margin.css
- frontend/src\components\trust\OwnTrustJourney.module.css

## Module hỗ trợ UX trực tiếp

Các module dưới đây không dựng markup chính nhưng điều khiển trạng thái, dữ liệu hiển thị, route/theme, xác thực hoặc media.

### Auth state và onboarding (frontend/src/lib/auth/)
- frontend/src/lib/auth\authCapabilities.js
- frontend/src/lib/auth\AuthContext.jsx
- frontend/src/lib/auth\authRedirects.js
- frontend/src/lib/auth\authService.js
- frontend/src/lib/auth\authStateMachine.js
- frontend/src/lib/auth\onboardingProfile.js
- frontend/src/lib/auth\presentationState.js

### API client phía trình duyệt (frontend/src/lib/api/)

- frontend/src/lib/api\auth.ts
- frontend/src/lib/api\client.ts
- frontend/src/lib/api\community.ts
- frontend/src/lib/api\errors.ts
- frontend/src/lib/api\experts.ts
- frontend/src/lib/api\runtimeClient.js
- frontend/src/lib/api\runtimeError.js
- frontend/src/lib/api\schemas\trust.ts
- frontend/src/lib/api\trust.ts

### UI state, theme/route, media registry

- frontend/src/lib/ui-state\clientModel.js
- frontend/src/lib/ui-state\model.ts
- frontend/src/lib/ultra\routes.js
- frontend/src/lib/ultra\themes.js
- frontend/src/lib/media\khaiMinhVisualRegistry.js
- frontend/src/lib/media\v3MediaRegistry.js
- frontend/src/lib/media\vnextMediaRegistry.js

### Tài liệu kiểm chứng trải nghiệm có sẵn

- docs/frontend/national-experience-2026-09-08/DESIGN-HANDOFF.md: handoff thiết kế “Khai Minh”, kiến trúc landing và các màn hình Trust/Community/Expert/Cases, token, typography, responsive, state, motion, accessibility.
- docs/frontend/v3-reference-intelligence/REFERENCE-BIBLE-V3.md, MOTION-STUDY-V3.md, TYPOGRAPHY-STUDY-V3.md, EVIDENCE-UX-STUDY-V3.md, DESIGN-VALIDATION-V3.md: nguyên tắc tham chiếu và kiểm chứng V3.
- docs/frontend/FRONTEND-AUDIT.md: audit ngày 2026-08-28; tài liệu tự ghi là lịch sử, không phải snapshot hiện tại.
- docs/frontend/PERFORMANCE.md: bằng chứng bundle, Lighthouse, CSS/font/media và accessibility.
- frontend/tests/e2e/visual-regression.spec.ts, responsive.spec.ts, accessibility.spec.ts, khai-minh-visual.spec.ts, typography-vietnamese.spec.ts: test kiểm tra hình ảnh, responsive, accessibility và tiếng Việt; đây là test chứ không phải UI runtime.

## Ghi chú để chuẩn bị redesign

1. Landing đang chạy được ghép qua app/page.jsx → landing/EvidenceWorldLanding.jsx → nhóm cinematic/*. Trong khi đó, một số file landing khác như AcademicHeroSection.jsx, TrustEngineShowcase.jsx, AcademicAiVerificationSection.jsx, CommunityExpertCouncilSection.jsx cũng tồn tại nhưng không được import trực tiếp trong app/page.jsx. Hãy kiểm tra đường import trước khi sửa để tránh redesign nhầm nhánh không active.
2. Các nhóm layout/*, navigation/*, academic-showcase/*, cinematic/*, landing/*, ui/*, ultra/* chứa nhiều thế hệ/biến thể giao diện. Một màn hình có thể dùng shell khác màn hình bên cạnh.
3. globals.css có token/alias từ nhiều giai đoạn thiết kế; .agents/DESIGN.md và vault mô tả Space Dark/glass, còn handoff “Khai Minh” mới hơn mô tả tỷ lệ editorial 70/precision 20/cinematic 10. Chốt tài liệu thiết kế làm nguồn chuẩn trước khi đổi token toàn cục.
4. frontend/src/app/api/**/route.* và service logic trong frontend/src/lib/server/** không phải lớp UI. Trước khi thay giao diện, giữ nguyên hợp đồng kết luận, trạng thái lỗi/thiếu dữ liệu và nguồn gốc bằng chứng; dùng component/API client hiện có làm ranh giới.
5. Tài nguyên visual nằm dưới frontend/public/ (165 file); kiểm kê code không lặp lại danh sách media. Các cụm chính gồm khai-minh/, studenthub-vnext/, v3/, academic/, atlas/, studio/, trust/, home/, auth/, cùng một số asset ở root.

## Cách cập nhật danh mục

Sau khi thêm/đổi/xóa route, component hoặc stylesheet, chạy lại rg --files frontend/src/app frontend/src/components frontend/src và cập nhật danh mục này. Danh sách trên phản ánh cây source tại ngày cập nhật, không tính node_modules, .next, test fixtures hoặc generated build output.
