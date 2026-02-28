import { useEffect, useRef } from 'react'

export default function Confetti() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        const particles = Array.from({ length: 120 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 4 + 2,
            color: ['#2E7D32', '#FFC107', '#43A047', '#FF7043', '#64B5F6'][Math.floor(Math.random() * 5)],
            w: Math.random() * 12 + 6, h: Math.random() * 8 + 4,
        }))
        let raf
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            particles.forEach(p => {
                ctx.fillStyle = p.color
                ctx.fillRect(p.x, p.y, p.w, p.h)
                p.x += p.vx; p.y += p.vy
                if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width }
            })
            raf = requestAnimationFrame(draw)
        }
        draw()
        return () => cancelAnimationFrame(raf)
    }, [])

    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }} />
}
