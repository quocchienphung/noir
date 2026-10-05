# NOIR — MASTER PROMPT V2: khôi phục độ nét + khám phá black hole 360°

Cập nhật theo yêu cầu ngày 05/10/2026, screenshot `Screenshot 2026-10-05 201256.png`. **Bản render hiện tại bị người dùng đánh giá kém hơn bản đầu.** File này thay thế prompt rebuild trước, không bổ sung thêm một danh sách việc phải chạy song song với prompt cũ.

## Cách giao việc cho Claude Code

Mở Claude Code tại gốc repo và gửi nguyên câu này:

```text
Đọc toàn bộ prompt/NOIR_BLACK_HOLE_REBUILD_PROMPT.md và thực thi MASTER PROMPT V2. Ưu tiên sửa hero bị mờ, phục hồi những dải sáng/filament nhìn rõ ở kích thước sử dụng thật; đồng thời triển khai click/tap để khám phá black hole bằng kéo xoay camera 360° trong 3D. Research các nguồn NASA, DNGR và Bruneton đã dẫn, kiểm chứng nhiều góc nhìn. Giữ scroll hiện tại, không thay bằng video hay ảnh. Không dùng báo cáo QA cũ làm bằng chứng rằng hình hiện tại đã đạt. Triển khai, chạy app, so sánh before/after và kiểm tra tương tác thật; không chỉ viết kế hoạch.
```

## Cơ sở của lần viết lại

Đã rà soát phiên bản code hiện tại: `shaders.ts`, `renderer.ts`, `scenes.ts`, `BlackHoleCanvas.tsx`, `BlackHoleQa.tsx`, hero/CSS liên quan, package scripts và `docs/research/noir/BLACK_HOLE_REBUILD.md`. Đã xem ảnh user, ảnh so sánh `before-after-hero-p0.jpg`, crop `crop-upper-arc.jpg` và frame video `reference/ref-0015.png` trong repo. Video gốc đã được mở ở lượt nghiên cứu trước; lần này dùng thêm frame lưu và nguồn khoa học trực tiếp cho góc nhìn 360°. Không tuyên bố đã đo lại GPU hay đã xem đầy đủ mọi frame của mô phỏng.

Điểm nhìn thấy: hero hiện tại có dải trước rộng như bụi/sương, vùng trắng quanh tâm bị hòa lại, thiếu các khe tối tách sợi sáng; cung trên có vài dải lớn mượt nhưng mất filament nhỏ. Ảnh so sánh lưu trong repo thể hiện cùng sự mất chi tiết này. Bản đầu còn lỗi vòng dây/alias, nhưng đọc được nhiều nét hơn; cần phục hồi độ rõ đó mà không đưa lỗi cũ trở lại.

Code hiện đã có volume slab, velocity Verlet, ray differentials, inward drift và shader QA. **Không còn đúng khi nói renderer chỉ là thin disk xoay noise, chưa có inward flow.** Các nguyên nhân dưới đây là đầu mối cần thí nghiệm, không phải kết luận đã profile.

---

# MASTER PROMPT V2 — BEGIN

Bạn là graphics engineer WebGL/GLSL, technical artist và interaction engineer. Làm việc trực tiếp trong app NOIR hiện có. Có hai đầu ra bắt buộc: **hero rõ nét, gần chất liệu video hơn**, và **người dùng bấm vào để kéo xoay xem black hole 360° thật, mượt, nhất quán về không gian và ánh sáng**.

## 1. Ý định, ưu tiên và phạm vi

1. Hero hiện tại chưa được chấp nhận. Không dùng việc có ray tracing, solver test xanh hoặc báo cáo nhiều số liệu để kết luận hình đẹp. Độ rõ của dòng khí và ánh sáng khi nhìn trang thật là tiêu chí chính.
2. Video đích: https://www.youtube.com/watch?v=784dsKVrdjQ — *Interstellar Gargantua Black Hole | 1 Hour Full HD Live Wallpaper*. Giữ chất trắng nóng/ngà/đồng, các sợi mảnh có khe tối, vùng khí có chiều sâu và lensing của reference. Không tự thay style bằng khói nâu, neon, đĩa Saturn hoặc vortex laser.
3. Mục tiêu bám sát video tối đa ở góc tương ứng. Một video góc cố định không xác định đầy đủ scene từ mọi hướng; phần 360° phải được dựng nhất quán dựa trên nghiên cứu, không được gọi là bản sao đã xác minh của các góc video không thể hiện.
4. Giữ scroll timeline, sticky track, chiều cao section, các mốc reveal, nội dung, logo, CTA và bố cục đã có. Được bổ sung interaction và điều phối camera khi khám phá; không làm lại trải nghiệm cuộn bình thường.
5. Chỉ dựng realtime từ scene 3D. Cấm footage, iframe, VideoTexture, image sequence, animated bitmap hoặc ảnh black hole dán lên plane rồi xoay. Poster chỉ là fallback, phải lấy từ renderer mới. Texture noise/density/flow và LUT vật lý là dữ liệu đầu vào hợp lệ, không phải video trá hình.
6. Fullscreen ray-tracing shader là 3D hợp lệ nếu dùng camera và scene trong không gian. Không bắt buộc thêm GLB/torus/sphere hoặc đổi sang Three.js để chứng minh có model.
7. Sửa hero trước, rồi bảo đảm material chung không làm hỏng cinematic framed/open. Chức năng khám phá 360° bắt buộc ở hero; không cần nhân đôi controls ở cinematic.
8. Không triển khai Kerr/MHD/GRMHD chỉ để tăng độ phức tạp. Chọn mô hình có giới hạn rõ, đủ cho hình đẹp và nhất quán. Giữ phần geodesic đã đúng nếu không có evidence cần thay.

## 2. Preflight và bản đồ code hiện hành

Đọc `AGENTS.md`, `CLAUDE.md` nếu có và docs liên quan của Next.js trong `node_modules/next/dist/docs/` trước khi viết code. Đọc git status và diff trước khi sửa; nhiều shader, test, poster và research đang có thay đổi của người dùng. Không reset, checkout cả file về HEAD, xoá output cũ hay phục hồi file đã bị người dùng xoá. Nếu cần học lại ưu điểm bản cũ, đọc git show/diff và dùng ảnh baseline; tích hợp chọn lọc.

| File | Trách nhiệm cần kiểm tra |
| --- | --- |
| `src/lib/noir/blackhole/shaders.ts` | `BAKE_FRAG`, `gasAt`, `boundAniso`, `slab`, ray differentials, capture/escape, bloom/composite |
| `src/lib/noir/blackhole/renderer.ts` | bake gas 512², sampler anisotropy, framebuffer, 7 cấp bloom, veil, GPU timer, `lookAt` |
| `src/lib/noir/blackhole/scenes.ts` | `GAS`, `diveFrame`, `cinematicFrame`, `referenceFrame`, `topdownFrame`; camera/look |
| `src/components/noir/BlackHoleCanvas.tsx` | resolution/tier, RAF, clock, pointer parallax, lifecycle, QA overrides |
| `src/components/noir/BlackHoleQa.tsx` | harness development; tái sử dụng cho ma trận góc, không lấy nó thay sản phẩm |
| `src/components/noir/NoirIntro.tsx` | vị trí scene, headline, CTA và nơi thêm entry/exit controls |
| `src/components/noir/useScrollTimeline.ts` | contract progress/smoothing cần giữ |
| `src/lib/noir/cinematic-timeline.ts` | giữ behavior framed/expanding/statement/exit |
| `src/styles/noir/{intro,black-hole,cinematic}.module.css` | scrim, canvas/poster sizing, clip, layer và event hit-testing |
| `tests/qa-*.mjs`, `tests/lib/` | đọc điều kiện chạy, chất lượng test và giới hạn detector |

Đọc `docs/research/noir/BLACK_HOLE_REBUILD.md` như lịch sử kỹ thuật. Các kết luận “no visible difference”, “true footprint”, “no pops” và “fringes are gone” cần kiểm lại ở hero người dùng đang xem. Báo cáo cũ tự ghi front band còn mềm và photon ring chưa rõ: đó là việc còn phải làm, không phải ngoại lệ được mặc nhiên chấp nhận.

## 3. Nghiên cứu bắt buộc cho look và 360°

Dùng nguồn gốc, ghi URL, ngày đọc, quan sát và tác động đến implementation trong `docs/research/noir/BLACK_HOLE_V2_CLARITY_ORBIT.md`. Không chỉ gắn link rồi đoán.

- **Look:** video người dùng và frame sạch `docs/design-references/noir/black-hole-rebuild/reference/ref-0015.png`, `ref-0045.png`. Xác minh metadata/timestamp trước khi dùng. Khi xem lại trực tuyến phải chờ seek decode xong; không lấy spinner làm frame.
- **Góc nhìn và hướng chuyển động:** [NASA SVS 13326 — Black Hole Accretion Disk Visualization](https://svs.gsfc.nasa.gov/13326/). Trang có mô phỏng quay trọn vòng và ghi chú correction về camera orientation. Phải nghiên cứu bản đã sửa, nhất là mặt trên, mặt dưới và đi qua mặt phẳng đĩa.
- **Cấu trúc ảnh:** [NASA — Anatomy](https://science.nasa.gov/universe/black-holes/anatomy/). Phân biệt event horizon, shadow và photon ring; không coi cung sáng là mesh halo đứng thẳng.
- **Khí và độ sáng theo hướng nhìn:** [NASA — A Black Hole’s Warped World](https://www.nasa.gov/universe/nasa-visualization-shows-a-black-holes-warped-world/). Tham khảo lane sáng/tối, shear và Doppler; không sao chép màu NASA nếu khác video.
- **Lensing/camera điện ảnh:** [James et al., DNGR/Interstellar](https://arxiv.org/html/1502.03808v1), đọc phần 2, 4 và các đoạn camera/filtering liên quan. Bài phân biệt mô hình Kerr, ray bundles và lựa chọn hình ảnh điện ảnh. Không tự nhận clip YouTube dùng nguyên pipeline DNGR, không tuyên bố renderer web đạt chất lượng IMAX chỉ vì dùng cùng thuật ngữ.
- **Tối ưu realtime:** [Eric Bruneton — A Real-time High-quality Black Hole Shader](https://ebruneton.github.io/black_hole_shader/). Nghiên cứu bảng tra tia cong và filtering nếu renderer hiện tại không giữ được nét trong ngân sách GPU. Kiểm tra phạm vi camera/tham số và license trước khi lấy code; không nhúng demo có sẵn.

Kết quả research cần có ảnh/sơ đồ đối chiếu cho góc gần ngang, chéo, trên, dưới và một vòng trở về điểm đầu. Nếu chưa xem được chuyển động, ghi giới hạn đó, không suy ra đã kiểm chứng motion từ ảnh tĩnh. Không dừng cả tác vụ ở research: tiếp tục các sửa đổi có thể chứng minh bằng source và baseline.

## 4. Điều tra độ mờ: các nghi phạm cụ thể trong code mới

### 4.1. Render resolution và adaptive quality

Hiện `high` có budget 1,000,000 pixels, `medium` 620,000; `MIN_SCALE = 0.32`, DPR bị chặn ở 1.5. Theo công thức budget, ở 2560×1440/DPR1, buffer khởi đầu high xấp xỉ 1333×750, tức gần 1.92 lần upscale mỗi chiều; đây là tính từ code, không phải đo session người dùng. Lưu cả CSS size, physical output, drawing buffer và scale thực.

- So cùng frame ở native scale và adaptive default. Nếu native nét còn default mờ thì giải quyết chất lượng runtime; không chỉ chụp chế độ ultra để báo đạt.
- Nếu native vẫn thiếu sợi thì đổi resolution không giải quyết mất thông tin trong material/filtering. Không chỉ tăng texture 512 lên 2048 và gọi đã sửa.
- Logic phục hồi hiện dùng `ema < 13ms`; trên màn 60Hz, RAF thường quanh 16.7ms nên điều kiện này có thể không bao giờ đạt dù còn GPU headroom. Kiểm tra tier giảm rồi có phục hồi hay không. Dùng budget theo cadence/GPU timing thích hợp, hysteresis, không gắn mặc định vào màn 165Hz.
- Adaptive quality không được “tụt mờ vĩnh viễn” sau một lần kéo. Sau khi nghỉ, chất lượng phải trở về mức tốt nhất đo được. Tránh resize framebuffer liên tục và pumping độ nét.

### 4.2. Chi tiết bị lọc nhiều lần trong `gasAt`

Đang có mipmapped gas texture, `textureGrad`, thay một vector footprint bằng `dZ` từ bước march, `boundAniso` mở rộng footprint, rồi `fadeA/M/B/X` tiếp tục trộn về 0.5. Phải đo mỗi tầng giữ/mất chi tiết nào, tránh lọc trùng khiến filament biến mất.

- `boundAniso` hiện so độ dài hai cột `dX`, `dY`, không phải phân rã các trục chính của footprint ellipse. Kiểm tra Jacobian bằng finite differences/ray lân cận tại cùng sự kiện giao khí; không mặc định tỷ lệ độ dài cột là anisotropy chính xác khi vector gần song song.
- Chain rule cần tính đến mapping có `omega(r)`, `vs(r)`, `period(r)`, age, shear, domain warp và height offset; các gradient hiện chủ yếu đến từ phi/log-r. So gradient ước lượng với sai phân hữu hạn. Sai số có thể gây thiếu hoặc thừa lọc, không đoán một chiều.
- Tách pixel footprint khỏi quadrature footprint dọc tia. Việc thay một trục bằng `dZ` có thể làm mượt quá mức. Dùng test hợp lý, không bỏ toàn bộ anti-aliasing.
- `fadeA/M/B/X` đang dùng `smoothstep(0.45, 0.12, ...)`. GLSL không bảo đảm kết quả nếu edge0 >= edge1; dùng dạng có thứ tự đúng như `1.0 - smoothstep(0.12, 0.45, x)` cho fade giảm và rà các trường hợp tương tự. Đây là lỗi portability cần sửa, chưa chứng minh là nguyên nhân duy nhất của ảnh mờ. [Đặc tả GLSL ES 3.00](https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf)
- Tăng anisotropy có thể tăng chi phí đáng kể. Đo các lựa chọn 4/8/16 nếu hỗ trợ và cần thiết; không mặc định cao nhất tốt nhất, không gọi việc làm rộng footprint là “không mất chi tiết” khi chưa so hero.

### 4.3. Material cố tình làm phẳng vùng quan trọng

`outerMix = smoothstep(uDiskIn, uDiskIn * 2.6, r)` khiến clump/regional contrast gần mép trong trộn về trung bình. `body` có density floor, `heatOut` cũng giảm biến thiên clump phía trong. Tài liệu cũ nói làm vậy để giảm fluctuation độ sáng. Phải kiểm tra việc ổn định tổng độ sáng có đang xoá đúng các luồng khí người dùng muốn thấy hay không.

- Giữ nhiều lane/knot cục bộ có tương phản, phân bố năng lượng để tổng ảnh ổn định; không giải quyết flare bằng san phẳng cả inner annulus.
- Kiểm tra `GAS.opacity = 30`, gain 19, hero exposure 1.6 và tích phân volume. Trong vùng optically thick, thay density có thể ít đổi độ sáng; chi tiết cần đi vào source function/nhiệt độ/độ che khuất có kiểm soát.
- Tách emission của dòng khí có cấu trúc và contribution khuếch tán, nhưng cả hai phải gắn cùng thế giới, cùng lensing/occlusion. Không dán nét 2D cuối pipeline.
- Kiểm tra `slab` khi chạm `uSlab` mà chưa đến cuối segment, thứ tự bounds trong clamp và quadrature convergence ở góc grazing/pole. Không nâng opacity chỉ để giấu thiếu sample.

### 4.4. Bloom, veil và các lớp trang

Renderer hiện có 7 cấp bloom, radius tăng theo level, cộng riêng coarsest level thành veil. Hero đặt `bloomGain=0.32`, `veil=0.6`; cinematic khác preset. Tách bloom core khỏi haze rộng và đo phần mất tương phản. Không kết luận chỉ từ giá trị uniform.

- Debug `bhView=1` hiện tắt cả bloom lẫn veil. Cần thêm ablation tắt riêng veil, bloom, grain để biết lớp nào gây mất lane.
- Xem raw radiance → tone-mapped no-bloom → narrow bloom → wide veil → ảnh DOM cuối. Vùng trắng nóng được phép cục bộ như video, nhưng không quét trắng mọi khe tối.
- Tắt grain khi đánh giá sharpness. Noise cao tần không phải chi tiết vật chất; sharpen noise không giải quyết blur.
- CSS hero có scrim đen ở trên/dưới; nó giảm độ sáng/tương phản, không tự gây Gaussian blur. Kiểm tra computed style và layer thật thay vì xoá scrim toàn trang làm chữ khó đọc. Blur của nút/headline không mặc nhiên là blur canvas.

## 5. Thí nghiệm tách nguyên nhân, không chỉnh mò

Tại hero p=0, freeze seed/time=12, pointer=0 và cùng camera, tạo ma trận:

| Bản | Điều thay đổi so baseline | Câu hỏi cần trả lời |
| --- | --- | --- |
| A | Default production hiện tại, đã warm-up | User thực sự nhận chất lượng gì? |
| B | Native buffer, giữ material/post như A | Upscale mất bao nhiêu nét? |
| C | B nhưng bỏ grain/bloom/veil | Chi tiết có tồn tại trước hậu kỳ không? |
| D | C, lần lượt ablate footprint cap/fade-to-mean | Tầng filtering nào xóa dải sáng? |
| E | C, chỉ thay suppression near-inner/body/heat | Material có tạo đủ dark lanes không? |
| F | C, thay thickness/optical depth/quadrature có kiểm soát | Volume có trộn các lớp thành sương không? |
| G | Phương án tốt nhất quay lại default runtime | Cải thiện có tồn tại ngoài chế độ QA không? |

Không tắt hết mọi thứ cùng lúc rồi kết luận biết nguyên nhân. Ghi mỗi trial: một thay đổi, before/after crop, chi phí, giữ/bỏ. Diagnostic không lọc có thể alias và không phải giải pháp production. Chụp PNG native, không đánh giá từ ảnh thu nhỏ vừa khung chat.

## 6. Đích hình ảnh: rõ nét nhưng vẫn hữu cơ

“Không còn vòng dây” trong yêu cầu cũ **không có nghĩa xoá mọi dải sáng quỹ đạo**. Reference có rất nhiều filament mảnh, rãnh tối và vệt kéo dài. Loại bỏ sự đều đặn nhân tạo, giữ cấu trúc có hướng.

- Cung trên: nhiều lớp filament liên tục đủ dài để mắt bám theo, độ dày/độ sáng thay đổi, có khe tối; không chỉ 5–10 dải to bóng mượt giống nhựa.
- Dải trước: white-hot/gold/copper được phân tầng, có lane tối giữa khí sáng và các knot kéo dài. Không thành thảm cát hoặc khói nâu mịn trùm ngang toàn màn hình.
- Vùng bẻ cong gần shadow: đường sáng có độ cong tăng và bị nén theo ánh xạ ray; texture liên kết được với cùng trường khí, không đứt vô cớ tại giao điểm.
- Cung dưới: có chi tiết và phân cấp sáng riêng; không mờ như ảnh phản chiếu phủ sương. Không bắt nó sáng/y hệt cung trên.
- Viền shadow: sạch, ổn định khi camera quay; photon ring mảnh có anti-aliasing, không thêm outline CSS và không cố giữ nguyên độ rộng pixel ở mọi khoảng cách.
- “Sáng chui vào hố đen”: phải thấy cấu trúc khí được shear và drift vào trong, rồi mất do profile phát xạ, che khuất/capture phù hợp. Không vẽ laser hướng tâm hay bắt mọi filament kết thúc tại tâm màn hình.
- Phải nhận ra đường khí ở kích thước trang thật, không cần crop 400%. Nhưng không ép hạt dưới pixel thành nét nhân tạo. Nếu phải chọn, ưu tiên cấu trúc trung bình có hướng và khe tối rõ hơn tăng noise nhỏ.
- Film grain/haze là lớp phụ. Không dùng blur, motion blur, temporal ghosting hoặc sharpening halo để tạo cảm giác “cinematic”.

Bản mới phải tốt hơn cả bản hiện tại lẫn ưu điểm của bản trước: rõ cấu trúc hơn hiện tại, ít vòng dây/răng cưa hơn bản đầu. Không chọn một trong hai lỗi rồi gọi là tradeoff đã được user chấp nhận.

## 7. 360° phải thể hiện gì: quy tắc cho model và camera

Đây là **camera orbit quanh scene**, không phải xoay ảnh bằng CSS, không phải chỉ xoay texture, cũng không phải thay spin vật lý của black hole theo chuột. Giữ disk/world coordinates ổn định và trace lại ray theo camera mới.

Bảng kỳ vọng dựa trên [NASA Anatomy](https://science.nasa.gov/universe/black-holes/anatomy/) và [mô phỏng 360° đã sửa của NASA SVS](https://svs.gsfc.nasa.gov/13326/):

| Góc nhìn | Kỳ vọng |
| --- | --- |
| Gần ngang đĩa | Các cung lensed nổi rõ; độ che khuất thay đổi theo hướng nhìn |
| Từ trên/xuống đúng trục đĩa | Đĩa đọc như vành quanh tâm; không giữ hai “bướu” như góc ngang |
| Từ dưới | Thấy mặt dưới; chiều quay biểu kiến khác mặt trên khi đối chiếu đúng camera |
| Đúng trục | Bất đối xứng Doppler do chuyển động quỹ đạo dọc đường nhìn mất đi; texture vẫn có thể không đều |

NASA SVS còn lưu correction về camera orientation: không kế thừa bản cũ thiếu thay đổi chuyển động/độ sáng. Dùng bản mới làm bài kiểm tra trực quan.

Các ràng buộc triển khai và giả định của sản phẩm:

- Mô hình mặc định vẫn là Schwarzschild như code hiện tại. Với giả định observer tĩnh tại cùng khoảng cách và camera nhìn về tâm, dùng tính đối xứng làm invariant chẩn đoán shadow. Hình khí bất đối xứng/foreground/bloom có thể khiến silhouette nhìn khác capture mask; không đánh đồng hai thứ.
- Không giữ “bên trái luôn sáng” bằng gradient screen-space. Tính từ vận tốc khí và hướng tia tại điểm phát; vì code trace ngược, kiểm tra đúng dấu. Mặt sáng phải đúng với camera, không hardcode đổi bên chỉ khi azimuth vượt 180°.
- Dưới mô hình disk gần đối xứng trục, quay azimuth ở cùng inclination có thể giữ silhouette gần giống; vật chất/knot/background giúp thấy thay đổi. Không ép scene biến dạng kịch tính vô cớ để chứng minh 360°.
- Không tự đảo dấu `orbit`, đổi noise seed hay phản chiếu UV khi camera xuống mặt dưới. Chuyển động biểu kiến phải do phép chiếu và lensing sinh ra. Disk có hai mặt/volume có bề dày, không mất vì culling khi nhìn dưới.
- Không dựng một halo dựng đứng cố định trong world space. Các cung lensed là kết quả đường đi ánh sáng; chúng phải thay đổi khi orbit, không bám thành một vòng mesh tại góc hero.
- Camera luôn ngoài horizon và ngoài volume khí trong mode khám phá. Radius khởi đầu giữ gần hero nếu an toàn; kiểm tra outer radius cùng envelope thickness. Không thêm zoom tự do xuyên tâm vì user chỉ yêu cầu xoay.
- Đây là camera khảo sát tương tác, không mô phỏng một observer thật bị gia tốc relativistic bởi thao tác chuột. Không lấy tốc độ drag làm vận tốc vật lý để tạo aberration/redshift dữ dội. Ghi giả định observer trong research.
- Thời gian khí tách khỏi orientation. Đổi góc không reset vật chất, không đổi flow speed, không tua time theo drag. Khi QA đóng băng khí, một vòng 360° trở lại cùng pose phải cho cùng ảnh trong sai số sampling.
- Nếu dùng LUT, xác minh nó hỗ trợ cả hai bán cầu, đi qua mặt phẳng đĩa và các radius hợp lệ. LUT khớp góc reference duy nhất không đủ.

## 8. Trải nghiệm click/tap → kéo xoay → quay lại scroll

Triển khai ngay trong hero, không bắt user sang route demo. Chọn flow này làm mặc định; tinh chỉnh vị trí control theo bố cục NOIR hiện tại, không thêm bảng kỹ thuật vào UI.

### Các trạng thái tương tác

| State | Camera/input | Chuyển tiếp |
| --- | --- | --- |
| `scroll` | Scene dùng camera/timeline hiện tại | Click/tap vùng scene hợp lệ hoặc nút “Explore 360°” → `entering` |
| `entering` | Lấy pose hiện tại làm đầu vào, chuyển sang orbit nếu cần | Kết thúc chuyển động → `orbit`; Escape/scroll có thể huỷ an toàn |
| `orbit` | Pointer/touch/keyboard điều khiển camera quanh tâm | Thả kéo vẫn giữ góc; Reset trả góc ban đầu; Close/Escape/scroll → `returning` |
| `returning` | Blend về camera của progress scroll mới nhất | Hội tụ → `scroll`, trả quyền input đầy đủ |

Đây là state machine đề xuất, không bắt buộc dùng đúng tên biến. Điều bắt buộc là chỉ một chủ thể quyết định pose cuối mỗi frame.

### Entry và hit testing

- Ở phần mở đầu hero, có một affordance nhỏ “Explore 360°”/“Drag to rotate” phù hợp tiếng Anh hiện tại. Không che black-hole core, headline hay CTA. Click/tap trực tiếp vào vùng media không tương tác cũng kích hoạt; không làm cả viewport thành button chặn links.
- Chỉ hiện entry khi hero còn ở vùng ngoài an toàn và đủ nhìn scene, trước giai đoạn dive sâu/statement. Không tự nhảy scroll về đầu khi click. Với progress không thích hợp, ẩn/disable entry theo state rõ ràng.
- Khi kích hoạt, camera bắt đầu tại pose đang thấy. Có thể giảm opacity copy phụ trong mode khám phá để nhìn scene, nhưng phải restore chính xác khi thoát; giữ exit/reset dễ thấy, không mở modal toàn màn hình mặc định.
- Chuột bắt đầu kéo trong vùng media có thể kích hoạt và kéo liền sau threshold nhỏ; click button/CTA vẫn chỉ thực hiện hành động của nó. Phân biệt click với drag, không click-through sau pointerup.
- `BlackHoleCanvas` hiện bọc `aria-hidden="true"`: giữ canvas trang trí nếu có controls semantic ở lớp riêng; tuyệt đối không đặt nút focusable bên trong cây bị aria-hidden. Không thêm listener rồi quên accessibility.

### Orbit đủ 360°, không chỉ parallax vài độ

- Kéo ngang được nhiều vòng liên tiếp, không chặn tại ±180°/±360°. Kéo dọc xem được mặt trên, mặt dưới và đi qua pole liên tục. Yêu cầu xem trọn sphere; yaw-only với pitch kẹp ±20° không đạt.
- Dùng quaternion/arcball hoặc representation có kiểm soát tương đương. `lookAt` hiện dựa trên cross với world-up sẽ suy biến khi forward gần trục Y; phải xử lý pole/basis ổn định, tránh NaN, roll flip, jump 180° hoặc reset góc.
- Định nghĩa rõ quỹ đạo quanh tâm: cập nhật cả camera position lẫn orientation/up/basis, không chỉ xoay hướng nhìn tại một điểm đứng yên. Khi drag nhiều vòng, cách unwrap/slerp phải phù hợp để không tự quay ngược khi qua seam.
- Drag đang diễn ra phải bám tay nhanh. Nếu có inertia sau khi thả, cho ngắn và tắt dần; không trôi hàng giây. Không tự reset vì user ngừng kéo.
- Reset View trả pose khám phá ban đầu bằng transition có thể ngắt bởi drag mới. Close/Escape trả camera scroll mới nhất, không chỉ set lại azimuth bằng 0.
- Khởi điểm tuning: drag response khoảng 50–100ms, decay khoảng 120–220ms, return khoảng 250–450ms. Đây là khoảng đề xuất UX, không hằng số physics hay thông số phải sao y. Đo cảm giác input và frame pacing thực, giảm lag nếu nhìn thấy.

### Không phá scroll, touch hoặc bàn phím

- Ở `scroll`, wheel/touch scrolling hoạt động như trước. Không `preventDefault` toàn trang, không scroll lock body hoặc đổi wheel thành zoom.
- Ở `orbit`, wheel/page scroll là ý định tiếp tục trang: chuyển `returning`, giữ native scrolling, blend tới pose được tính từ progress đang thay đổi. Không kéo camera về p lúc bắt đầu tương tác khi user đã cuộn tới nơi khác.
- Touch mặc định vẫn cuộn trang; người dùng tap entry mới kích hoạt vùng drag riêng. `touch-action` cần được đặt đúng trước gesture, giới hạn trên surface đang active. Có Close rõ; các vùng ngoài scene và browser pinch-zoom không bị vô hiệu toàn cục. Xử lý thao tác nhiều ngón/pointercancel, không trap user trong canvas.
- Dùng pointer capture/release; xử lý pointerup ngoài khung, lostpointercapture, pointercancel, tab blur, visibility change, resize và unmount. Không mắc kẹt ở grabbing.
- Arrow keys xoay khi vùng tương tác đang focus; Enter/Space kích hoạt controls, Escape thoát; Reset có nút semantic. Không chặn keyboard toàn trang. Focus ring rõ và trả focus hợp lý khi thoát.
- `prefers-reduced-motion`: không tự chạy khí/inertia dài; user vẫn có thể chủ động đổi góc với cập nhật trực tiếp hoặc transition tối thiểu. Fallback không có WebGL phải thông báo khả năng xoay không khả dụng, không hiển thị nút “xoay” vô tác dụng.

## 9. Thiết kế code để hai hệ camera không giành nhau

Định nghĩa một camera/controller API rõ, ví dụ phần scroll tạo `basePose(progress)`, orbit controller tạo `explorePose`, một resolver duy nhất chọn/blend pose để renderer dùng. Tách config vật liệu, chất lượng, simulation time và interaction state.

- Khi orbit active, tắt pointer parallax cũ và auto camera wobble từ `sin(input.time...)`; chúng không được cộng ngoài ý muốn vào drag. Khi thoát mới blend lại. Freeze time không được là cách duy nhất để freeze camera trong QA.
- Orbit dùng cùng shader/material/seed như hero, không render một black hole thứ hai đẹp hơn chỉ trong mode explore. Framing có thể đổi để nhìn object rõ nhưng không đổi chất liệu khi click.
- Không tạo thêm WebGL context và RAF cạnh tranh mỗi lần vào mode. Reuse resource, bake texture một lần/context; không set React state cho mỗi pointermove/frame nếu không cần.
- Overlay/header/CTA phải có pointer-event ownership rõ. Không sửa z-index đại khái gây mất click hoặc phá sticky clip.
- Thay uniform/camera qua ref và RAF; xét event delta theo CSS pixels, devicePixelRatio và viewport để sensitivity nhất quán. Không gắn rotation vào tần số event 60/144/165Hz.
- Damping dựa vào delta time, chặn dt bất thường sau tab resume. Không cộng vận tốc quá lớn từ vài giây mất focus. Preserve pose hợp lý khi resize hoặc context restore.
- Development harness có thể nhận camera orientation/radius độc lập để chụp góc; không ship panel/debug query vào production. Cập nhật test hiện có phù hợp contract mới, không vô hiệu chúng cho build xanh.

## 10. Realistic motion cần đọc được trong beauty render

`bhDebug=3` đang vẽ marker bằng công thức riêng. Marker đi vào trong chứng minh được mapping đó, **không chứng minh người dùng nhìn thấy khí beauty đang chảy vào trong**. Các phase blended có thể làm nét morph dù marker đi đúng.

- Quay clip trực tiếp từ hero không marker, cùng góc đứng yên, theo dõi các knot/filament sáng tối có sẵn qua nhiều frame. Dùng annotation trong tài liệu QA nếu cần, không thêm marker vào sản phẩm.
- Giữ orbital shear và radial drift nhất quán. Có thể chỉnh tốc độ ở mức art direction hợp lý để cảm nhận được, nhưng không tăng mạnh drift biến đĩa thành xoáy nước.
- Rà phase blending sau mốc phase liên quan, seam phi/2π và tương quan pattern giữa các ảnh lensed. Không dùng frame-difference trung bình thấp để chứng minh không morph: ảnh bị blur nặng cũng có số đó rất tốt.
- Giữ được các khe tối khi đứng yên lẫn khi đang orbit chậm. High shutter blur/ghost không được coi là animation mượt.
- Mượt = camera bám input, frame time ổn định, geometry không popping, flow liên tục và chi tiết ổn định; không đồng nghĩa làm mờ toàn bộ.

## 11. Chất lượng và hiệu năng: nghiệm thu ở cấu hình user thật

Đo riêng bản development và production sau warm-up. Chất lượng production/default là đầu ra, native/ultra chỉ là công cụ chẩn đoán.

- Ghi browser, GPU thực, refresh cadence, CSS viewport, DPR, buffer, tier, render scale, GPU median/p95 nếu timer khả dụng, RAF/frame pacing và input latency quan sát được. Không lấy GPU hoặc thời gian trong báo cáo cũ làm số của bản mới.
- Mục tiêu desktop khoảng 60fps với p95 frame budget quanh 16.7ms, mobile khoảng 30fps/33.3ms trên thiết bị đã đo. Đây là mục tiêu, không cam kết universal. Đo hero p=0, orbit các góc đắt nhất, chuyển mode và dive; không chỉ đo lúc tâm đen chiếm cả màn hình.
- Dùng ngân sách GPU cho độ nét cần thiết. Nếu native quá đắt, tối ưu sampling/tracing/filtering, chọn resolution/quality hợp lý; không bảo đảm FPS bằng cách đẩy production về ảnh mờ rồi chụp QA ultra.
- Có thể đánh giá LUT, sampling thích nghi hoặc reconstruction có kiểm chứng. Nếu dùng temporal accumulation, phải xử lý disocclusion, camera motion và history reset/reprojection; không dùng stale history kéo đuôi khi orbit. Không bắt buộc triển khai TAA nếu nó làm task lớn hơn mà không cải thiện.
- Giữ material cùng cấp độ cấu trúc giữa các tier; không đổi silhouette/flow khi hạ tier. Khi dừng kéo, phục hồi chất lượng êm, không pop sáng hoặc nét; đo thời gian phục hồi và tiêu chí headroom.
- Nếu chọn 30fps cho một phần cứng, báo rõ thiết bị và giới hạn. Không tự nhận “render mượt” từ clip 1 frame mỗi giây hay từ screenshot.

## 12. Quy trình có checkpoint hình ảnh

1. **Lưu baseline:** screenshot hiện tại, before từ lần đầu, frame video; không ghi đè evidence cũ. Tạo thư mục mới `docs/design-references/noir/black-hole-v2/` với metadata. Ghi cả state default sau 1/5/20 giây để phát hiện adaptive tụt nét.
2. **Định nghĩa mục tiêu:** đánh dấu trên crop các filament/khe tối cần đọc được và các vùng đang bị mờ. Research góc nhìn theo mục 3; phân biệt quan sát, đo đạc và giả định.
3. **Chẩn đoán:** làm ma trận mục 5 và giữ thay đổi có evidence. Không bắt đầu bằng viết lại toàn bộ ray tracer hoặc đổi engine.
4. **Sửa hero clarity:** đạt contour/lane/material trước khi thêm post. Giữ một ảnh pass raw và ảnh pass post để chứng minh ánh sáng không che thông tin.
5. **Triển khai orbit:** dùng cùng scene đã cải thiện; kiểm tra all-angle ở fixed time trước, rồi bật flow. Sửa basis, occlusion, singularities và directional shading phát hiện được.
6. **Tích hợp UX:** entry/drag/reset/exit/scroll/touch/keyboard, kiểm tra default UI giữ layout. Tối ưu performance dựa trên bottleneck thật.
7. **Regression và báo cáo:** chạy checks, kiểm tra cả cinematic, chụp default production và quay tương tác thực. Nếu gate thất bại, tiếp tục sửa phần cụ thể; không thay tiêu chí nghiệm thu để khớp kết quả đang có.

Không tự dừng để hỏi có muốn tiếp tục sau research hoặc kế hoạch. Chỉ hỏi khi thiếu dữ kiện thực sự không thể suy ra; vẫn làm các phần độc lập. Không commit/deploy nếu chưa được yêu cầu. Không thay nội dung kinh doanh hoặc brand ngoài phạm vi.

## 13. QA hình ảnh và góc nhìn: phải có đủ bằng chứng

### 13.1. Ma trận độ nét

- Desktop 1440×900, 1920×1080, 2560×1440; mobile 390×844. Dùng thêm viewport thật của người dùng khi đo được; screenshot đính kèm có browser/taskbar, không lấy kích thước cả ảnh làm kích thước canvas.
- Hero p=0, p=0.25, p=0.5; cinematic framed/open. Cùng camera, time, seed, pointer khi so code versions. Không dùng thumbnail nhỏ cho kết luận sharpness.
- Crop 1:1 năm vùng: upper arc, junction, foreground band, lower arc, shadow edge. PNG lossless, cùng output size. So ba cột bản đầu / bản đang bị chê / bản mới, và crop video riêng ở góc QA tương ứng.
- So reference cần cùng camera/crop/aspect, không kéo giãn để ép match. Hero giữ composition riêng; không gọi việc không giống crop video là lỗi hình học khi góc khác.
- Kiểm tra **có hay không** dark lanes, độ rộng đường, local contrast và highlight clipping. Có thể đo profile cắt ngang filament và edge spread nếu hai crop khớp feature, nhưng không đặt con số tùy tiện rồi gọi chính xác tuyệt đối.
- SSIM/edge energy/Laplacian hoặc total luma chỉ hỗ trợ chẩn đoán; noise/sharpen cũng tăng metric. Hình blur có thể giảm temporal variation rất tốt mà vẫn sai. Không dùng một score làm phép thay thế visual review.

### 13.2. Ma trận camera 360°

Trong harness có metadata rõ: inclination `i` đo từ pháp tuyến +Y của disk; i=0° là mặt trên, 90° là nhìn ngang, 180° là mặt dưới. Azimuth đo quanh cùng world axis. Đây là convention QA; interaction có thể dùng quaternion.

- Chụp i = 0°, 30°, 60°, 85°, 90°, 95°, 120°, 150°, 180° với cùng radius/time/exposure. Ở mỗi nhóm chọn azimuth 0°, 90°, 180°, 270°; kiểm tra 360° trở về 0° khi freeze time.
- Test quay một vòng ngang và một vòng dọc đi qua cả hai pole, không chỉ quay 0→350° rồi reset. Không có NaN/black flash, texture seam, involuntary roll flip hoặc culling mặt dưới.
- Dùng texture kiểm thử định hướng/asymmetric markers trong harness để chứng minh camera đi quanh scene, kiểm tra mặt trước/sau và handedness. Sau đó bắt buộc beauty render cũng đúng. Debug pass không thay nghiệm thu sản phẩm.
- Test pose đầu/cuối 360° bằng cùng quaternion/basis và time; phân biệt sai số sampling với lỗi wrap góc. Với animation đang chạy, không yêu cầu đầu/cuối có cùng pattern khí.
- Xem cung sáng, foreground và vùng khuất thay đổi từ cùng scene, không có silhouette kiểu hero dán cố định ở mọi góc. Không tự sửa vùng tối bằng mask tròn screen-space.

### 13.3. Ma trận tương tác và lifecycle

- Mouse: click activate, drag ngắn/dài, nhiều vòng, thả ngoài canvas, Reset giữa inertia, drag ngắt Reset, Escape, wheel khi đang drag, quay lại đầu trang.
- Touch: cuộn trang trước khi activate, tap activate, kéo xem mặt dưới, Close, tiếp tục scroll; pointercancel/multitouch; không mất khả năng thoát. Test thiết bị touch thật nếu có; nếu chỉ giả lập thì ghi rõ.
- Keyboard: tab tới control, activate, xoay, reset/exit, focus restoration; không có control trong aria-hidden.
- Scroll: đi xuống/lên nhanh, đổi góc rồi scroll tiếp, Back/Forward, route khác → Home, refresh giữa cinematic; scroll không bị khoá và camera không teleport về góc cũ.
- Lifecycle: resize/orientation change, tab ẩn/hiện, reduced motion thay đổi, WebGL context loss/recovery, unmount/remount. Camera và RAF không nhân đôi, quality không mắc kẹt mức thấp.
- Clip chuyển động thực 10–15 giây ở tốc độ bình thường cho mỗi thao tác quan trọng; thêm 30–60 giây beauty fixed-camera và đoạn qua phase seam. Dãy ảnh mỗi giây chỉ là supplemental evidence, không chứng minh input smoothness/60fps.

### 13.4. Các lệnh và test

Đọc `package.json` và scripts trước khi chạy vì có script cần server dev, có script cần production. Chạy `npm run lint`, `npm run typecheck`, `npm run build`, `npm run qa:geodesic`, cùng `qa:scroll`, `qa:routes`, `qa:blackhole`, `qa:independence`, `qa:visual` phù hợp. Dùng baseUrl/port đúng thực tế, không mặc định app luôn ở 3000.

Viết thêm test có ý nghĩa cho camera wrap/pole finite basis, entry-exit và input ownership, default-quality recovery trên cadence 60Hz, scroll sau orbit. Nếu test orbit closure thì freeze time/camera wobble. Nếu đo flow, phải có beauty evidence ngoài marker. Không viết hàng loạt test chỉ assert giá trị config hiện có.

Kiểm tra production thật có canvas live, không dùng poster để giấu compile error; không network request lấy video/sequence. Dev route/hook không lộ ngoài sản phẩm. Cập nhật poster từ scene mới sau khi look được xác minh.

## 14. Gate nghiệm thu không được né

| Gate | Đạt | Không đạt |
| --- | --- | --- |
| Hero rõ | Đọc được nhiều lane/filament và khe tối ngay trên trang | Chỉ rõ trong native QA; default vẫn sương/cát |
| Bám reference | Chất khí, white-hot cục bộ và cấu trúc cong thuyết phục | Vài vòng nhựa mượt, neon, noise giả chi tiết |
| Flow | Beauty có feature liên tục drift/shear hợp lý | Chỉ debug marker đi đúng hoặc chỉ camera zoom |
| Lensing | Ảnh disk và shadow thay đổi nhất quán theo view | Halo dựng đứng/texture screen-space cố định |
| 360° thật | Kéo nhiều vòng, xem được trên/dưới, qua pole ổn định | Chỉ parallax, yaw-only, pitch clamp chật hoặc lật hình |
| Mượt | Input bám tay, frame pacing đo được, không ghost/pop | Motion blur che giật, blur mạnh khi kéo, quality không phục hồi |
| Scroll | Native scroll và timeline cũ còn đúng trước/sau khám phá | Camera tranh quyền, scroll lock, jump hoặc CTA mất click |
| Accessibility | Có controls keyboard/touch/exit và fallback trung thực | Gesture-only, focus trap hoặc nút 360° vô tác dụng |
| Fidelity runtime | Default production đạt trên thiết bị được đo | Chỉ ảnh offline/high-tier được chọn để báo pass |

Nếu bản mới vẫn nhìn kém bản đầu ở độ đọc dòng sáng, **chưa xong** dù mô hình vật lý phức tạp hơn. Không nhất thiết rollback toàn model; chọn lọc phục hồi cấu trúc rõ, sửa filtering/material/post và tiếp tục kiểm chứng.

## 15. Bàn giao ngắn, có evidence

Báo cáo: nguyên nhân đã chứng minh của blur; thay đổi nào phục hồi filament; camera orbit vận hành thế nào; giả định vật lý và giới hạn; file chính đã sửa; kết quả check thực chạy; ảnh/clip default production; hardware/frame time; phần còn lệch reference.

Phân biệt rõ: “đã đọc nguồn”, “đã xem frame”, “đã đo”, “suy luận”, “chưa kiểm chứng”. Không tự tuyên bố 100% giống video, realistic tuyệt đối hay 60fps mọi máy. Không lấy số nghiên cứu cũ làm số mới. Không kết thúc chỉ bằng “đã thêm volume/ray differentials/quaternion”. Sản phẩm phải nhìn tốt hơn và dùng được.

**Chỉ dẫn cuối:** sửa cảnh hero đang mờ, làm các luồng sáng đọc rõ và có chuyển động thuyết phục; cho người dùng thực sự kéo xem black hole từ mọi phía bằng renderer 3D, mượt và giữ scroll. Hãy triển khai và tự kiểm tra kết quả, không thêm lời hứa thay cho hình ảnh.

# MASTER PROMPT V2 — END
