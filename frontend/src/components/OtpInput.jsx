import { useRef } from 'react'

export default function OtpInput({ value, onChange }) {
    const refs = Array.from({ length: 6 }, () => useRef(null))

    const handleChange = (i, v) => {
        const digits = value.split('')
        digits[i] = v.slice(-1)
        onChange(digits.join(''))
        if (v && i < 5) refs[i + 1].current?.focus()
    }

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !value[i] && i > 0) refs[i - 1].current?.focus()
    }

    return (
        <div className="otp-grid">
            {Array.from({ length: 6 }).map((_, i) => (
                <input
                    key={i}
                    ref={refs[i]}
                    className="otp-box"
                    type="tel"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onFocus={e => e.target.select()}
                />
            ))}
        </div>
    )
}
