# Local domain benchmark

Measured: 2026-10-01; win32; Node v22.23.3.

Hardware: Intel(R) Core(TM) i5-7400 CPU @ 3.00GHz; 24.0 GiB RAM.

One local run, 5 warmups and 30 measured samples per fixture. Domain functions only; this does not measure VS Code providers, rendering or game performance.

Cold catalog JSON loading and registry construction: 132.45 ms.

- autoexec.cfg: 5518 characters; parse p95 1.36 ms; health analysis p95 3.09 ms.
- practice.cfg: 10349 characters; parse p95 0.37 ms; health analysis p95 2.38 ms.

The effective model uses a 1000-statement expansion budget. Results exceeding the modeled subset remain partial. Timings are observations, not performance guarantees.
