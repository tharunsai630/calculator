
      // Calculator state and logic
      (function () {
        const prevEl = document.getElementById('prev-display');
        const currEl = document.getElementById('curr-display');
        const keypad = document.querySelector('.grid');

        /**
         * Internal state
         * prev: previous numeric value (string form)
         * curr: current numeric input (string form)
         * op:   current operator: '+', '-', '*', '/'
         * justEvaluated: flag to know when to start a new input after '='
         */
        let prev = '';
        let curr = '0';
        let op = '';
        let justEvaluated = false;

        // Helpers
        const isOperator = (c) => ['+', '-', '*', '/'].includes(c);

        function formatNumber(str) {
          // Keep as string for input; add grouping to integer part for display
          if (str === '' || str === '-') return str || '0';
          const n = Number(str);
          if (!isFinite(n)) return str;
          const [intPart, decPart] = str.split('.');
          const grouped = Number(intPart).toLocaleString(undefined);
          return decPart !== undefined ? `${grouped}.${decPart}` : grouped;
        }

        function updateDisplays() {
          currEl.textContent = formatNumber(curr);
          let prevText = '';
          if (prev !== '') prevText += formatNumber(prev) + ' ';
          if (op) prevText += symbolForOp(op);
          prevEl.textContent = prevText.trim();
        }

        function symbolForOp(o) {
          return o === '*' ? '×' : o === '/' ? '÷' : o;
        }

        function clearAll() {
          prev = '';
          curr = '0';
          op = '';
          justEvaluated = false;
          updateDisplays();
        }

        function deleteOne() {
          if (justEvaluated) { // DEL after equals resets current
            curr = '0';
            justEvaluated = false;
            updateDisplays();
            return;
          }
          if (curr.length <= 1 || (curr.length === 2 && curr.startsWith('-') && !curr.includes('.'))) {
            curr = '0';
          } else {
            curr = curr.slice(0, -1);
            if (curr === '-' || curr === '' || curr === '-0') curr = '0';
          }
          updateDisplays();
        }

        function appendDigit(d) {
          if (justEvaluated) { curr = '0'; justEvaluated = false; }
          if (curr === '0') curr = d; else curr += d;
          updateDisplays();
        }

        function appendDecimal() {
          if (justEvaluated) { curr = '0'; justEvaluated = false; }
          if (!curr.includes('.')) {
            curr += (curr === '' ? '0' : '') + '.';
            if (curr === '.') curr = '0.';
            updateDisplays();
          }
        }

        function chooseOperator(nextOp) {
          // Prevent multiple operators; allow changing operator before entering next number
          if (op && prev !== '' && curr === '0' && !justEvaluated) {
            op = nextOp;
            updateDisplays();
            return;
          }
          if (prev === '') {
            prev = curr;
            curr = '0';
            op = nextOp;
          } else if (!justEvaluated) {
            // Chain: compute previous first
            compute();
            op = nextOp;
          } else {
            // Just evaluated, keep result as prev and set new op
            op = nextOp;
            curr = '0';
            justEvaluated = false;
          }
          updateDisplays();
        }

        function compute() {
          if (op === '' || prev === '') return; // nothing to do
          const a = Number(prev);
          const b = Number(curr);
          if (!isFinite(a) || !isFinite(b)) return;
          if (op === '/' && b === 0) {
            // Division by zero error handling
            currEl.textContent = 'Error';
            prevEl.textContent = '';
            prev = '';
            curr = '0';
            op = '';
            justEvaluated = true;
            return;
          }
          let res = 0;
          switch (op) {
            case '+': res = a + b; break;
            case '-': res = a - b; break;
            case '*': res = a * b; break;
            case '/': res = a / b; break;
          }
          // Fix floating precision issues and limit length
          const fixed = Math.round((res + Number.EPSILON) * 1e12) / 1e12;
          curr = String(fixed);
          prev = '';
          op = '';
          justEvaluated = true;
          updateDisplays();
        }

        // Click handling
        keypad.addEventListener('click', (e) => {
          const btn = e.target.closest('button.key');
          if (!btn) return;
          const num = btn.getAttribute('data-num');
          const dec = btn.hasAttribute('data-decimal');
          const action = btn.getAttribute('data-action');
          const opAttr = btn.getAttribute('data-op');

          if (num) return appendDigit(num);
          if (dec) return appendDecimal();
          if (action === 'ac') return clearAll();
          if (action === 'del') return deleteOne();
          if (action === 'equals') return compute();
          if (opAttr) return chooseOperator(opAttr);
        });

        // Keyboard handling
        window.addEventListener('keydown', (e) => {
          const { key } = e;
          if (/^[0-9]$/.test(key)) { appendDigit(key); return; }
          if (key === '.' || key === ',') { e.preventDefault(); appendDecimal(); return; }
          if (key === '+' || key === '-' || key === '*' || key === '/') { chooseOperator(key); return; }
          if (key === 'Enter' || key === '=') { e.preventDefault(); compute(); return; }
          if (key === 'Backspace') { deleteOne(); return; }
          if (key === 'Escape' || key === 'Delete') { clearAll(); return; }
        });

        updateDisplays();
      })();

      // Subtle animated background using Canvas
      (function () {
        const canvas = document.getElementById('bg-canvas');
        const ctx = canvas.getContext('2d');
        let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        let W = 0, H = 0;

        function resize() {
          W = Math.floor(window.innerWidth);
          H = Math.floor(window.innerHeight);
          canvas.width = Math.floor(W * dpr);
          canvas.height = Math.floor(H * dpr);
          canvas.style.width = W + 'px';
          canvas.style.height = H + 'px';
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();
        window.addEventListener('resize', resize);

        // Floating shapes and particles
        const shapes = [];
        const particles = [];
        const SHAPE_COUNT = 14;
        const PARTICLE_COUNT = 80;

        function rand(min, max) { return Math.random() * (max - min) + min; }
        function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

        function createShape() {
          const type = pick(['circle','square','triangle']);
          const size = rand(24, 72);
          const x = rand(-size, W + size);
          const y = rand(-size, H + size);
          const speed = rand(0.08, 0.25);
          const drift = rand(-0.12, 0.12);
          const hue = rand(200, 220);
          const alp = rand(0.06, 0.12);
          return { type, x, y, size, speed, drift, hue, alp, rot: rand(0, Math.PI*2), rSpeed: rand(-0.002, 0.002) };
        }

        function createParticle() {
          return {
            x: rand(0, W),
            y: rand(0, H),
            r: rand(0.5, 1.8),
            spx: rand(-0.1, 0.1),
            spy: rand(-0.12, 0.12),
            alp: rand(0.08, 0.15)
          };
        }

        for (let i = 0; i < SHAPE_COUNT; i++) shapes.push(createShape());
        for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());

        function step() {
          ctx.clearRect(0, 0, W, H);

          // soft vignette
          const grad = ctx.createRadialGradient(W*0.5, H*0.5, Math.min(W,H)*0.2, W*0.5, H*0.5, Math.max(W,H)*0.75);
          grad.addColorStop(0, 'rgba(8,10,14,0)');
          grad.addColorStop(1, 'rgba(8,10,14,0.35)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);

          // draw shapes
          for (const s of shapes) {
            s.y += s.speed;
            s.x += s.drift;
            s.rot += s.rSpeed;
            if (s.y - s.size > H + 20) { s.y = -s.size; s.x = rand(-s.size, W + s.size); }
            if (s.x < -s.size) s.x = W + s.size;
            if (s.x > W + s.size) s.x = -s.size;

            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rot);
            ctx.globalAlpha = s.alp;
            ctx.fillStyle = `hsl(${s.hue} 70% 62%)`;
            ctx.strokeStyle = `hsl(${s.hue} 70% 60% / 0.6)`;
            ctx.lineWidth = 1.2;
            switch (s.type) {
              case 'circle':
                ctx.beginPath(); ctx.arc(0, 0, s.size/2, 0, Math.PI*2); ctx.fill(); break;
              case 'square':
                ctx.beginPath(); ctx.rect(-s.size/2, -s.size/2, s.size, s.size); ctx.fill(); break;
              case 'triangle':
                ctx.beginPath();
                const h = s.size * 0.866; // equilateral
                ctx.moveTo(0, -h/2); ctx.lineTo(-s.size/2, h/2); ctx.lineTo(s.size/2, h/2); ctx.closePath(); ctx.fill();
                break;
            }
            ctx.restore();
          }

          // particles
          ctx.globalAlpha = 1;
          ctx.fillStyle = 'rgba(205, 225, 255, 0.08)';
          for (const p of particles) {
            p.x += p.spx; p.y += p.spy;
            if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
          }

          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      })();
    