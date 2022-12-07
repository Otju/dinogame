import React, { useRef, useEffect, KeyboardEvent, useState } from 'react'
import ReactDOM from 'react-dom'

type Obstacle = {
  x: number
  y: number
  width: number
  height: number
  image: HTMLImageElement
}

type Point = {
  x: number
  y: number
}

const DinoGame = () => {
  const canvasRef = useRef(null)
  const jumpRef = useRef(false)
  const [isEnd, setIsEnd] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const [restart, setRestart] = useState(false)

  const handleClick = () => {
    if (!isStarted) {
      setIsStarted(true)
    }
    jumpRef.current = true
  }

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'w') {
      if (isEnd) {
        doRestart()
      } else {
        jumpRef.current = true
      }
      if (!isStarted) {
        setIsStarted(true)
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current as unknown as HTMLCanvasElement // sus
    const context: CanvasRenderingContext2D | null = canvas.getContext('2d')
    const obstacleTypes = [
      { targetHeight: 130, image: 'Error.svg' },
      { targetHeight: 75, image: 'Taxi.svg' },
      { targetHeight: 120, image: 'Manga.svg' },
    ]
    let animationFrameId: number
    let frameCount = 0
    let playerY = 0
    let playerYVelocity = 0
    let lastJumpPress = -1000
    const playerHeight = 120
    const groundHeight = 30
    let currentObstacles: Obstacle[] = []
    let groundSpecs: Point[] = []
    const createSpec = (x?: number): Point => {
      return {
        x: x || canvas.width,
        y: Math.random() * (groundHeight - 15 + 10),
      }
    }
    for (let i = 0; i <= canvas.width; i++) {
      if (i % 4 === 0) {
        groundSpecs.push(createSpec(i))
      }
    }
    let tickCount = 0
    let gameHasEnded = false

    class HitBox {
      width: number
      height: number
      bottomLeft: Point

      constructor(width: number, height: number, bottomLeft: Point) {
        this.width = width
        this.height = height
        this.bottomLeft = bottomLeft
      }
      get minX() {
        return this.bottomLeft.x
      }
      get minY() {
        return this.bottomLeft.y
      }
      get maxX() {
        return this.bottomLeft.x + this.width
      }
      get maxY() {
        return this.bottomLeft.y + this.height
      }

      isCollisionWith(other: HitBox) {
        const xCollide = this.minX <= other.maxX && this.maxX >= other.minX
        const yCollide = this.minY <= other.maxY && this.maxY >= other.minY
        return xCollide && yCollide
      }
    }

    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.width)
      ctx.fillStyle = 'black'
      ctx.fillRect(0, ctx.canvas.height - groundHeight, ctx.canvas.width, 2)
      groundSpecs.forEach((spec) => {
        ctx.fillRect(spec.x, canvas.height - spec.y, 1, 1)
      })
      const playerStartY = ctx.canvas.height - playerHeight - playerY
      const image = new Image()
      const animationSlowMult = 3
      const picIndex = Math.floor((tickCount % (40 * animationSlowMult)) / (10 * animationSlowMult))
      image.src =
        playerY === 0 ? ['Stand.svg', 'Walk1.svg', 'Stand.svg', 'Walk2.svg'][picIndex] : 'Stand.svg'
      const multiplier = playerHeight / image.height
      const scaledWidth = image.width * multiplier
      const scaledHeight = image.height * multiplier
      ctx.drawImage(image, 50, playerStartY, scaledWidth, scaledHeight)
      const playerHitBox = new HitBox(scaledWidth, scaledHeight, {
        x: 50,
        y: playerStartY,
      })
      currentObstacles.forEach((obstacle) => {
        const obstacleY = ctx.canvas.height - obstacle.y
        const hitBox = new HitBox(obstacle.width, obstacle.height, {
          x: obstacle.x,
          y: obstacleY,
        })
        if (hitBox.isCollisionWith(playerHitBox)) {
          if (!gameHasEnded) {
            setIsEnd(true)
            gameHasEnded = true
          }
        }
        ctx.drawImage(obstacle.image, obstacle.x, obstacleY, obstacle.width, obstacle.height)
      })
      const score = tickCount / 30
      ctx.fillStyle = 'black'
      ctx.font = '24px Common Pixel'
      const digits = 5
      const scoreText = score.toFixed(0)
      const zeroes = '0'.repeat(digits - scoreText.length)
      const scoreTextWithZeroes = zeroes + scoreText
      ctx.fillText(scoreTextWithZeroes, ctx.canvas.width - 90, 30)

      if (gameHasEnded) {
        const gameOverText = 'GAME OVER'
        ctx.font = '40px Common Pixel'
        ctx.fillText(
          gameOverText,
          ctx.canvas.width / 2 - ctx.measureText(gameOverText).width / 2,
          100
        )
      }
    }

    const createObstacle = (): Obstacle => {
      const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)]
      const image = new Image()
      image.src = obstacleType.image
      const multiplier = obstacleType.targetHeight / image.height
      const scaledWidth = image.width * multiplier
      const scaledHeight = image.height * multiplier
      return {
        x: canvas.width + Math.random() * 100 + 250,
        y: scaledHeight + Math.random() * (groundHeight - 15 + 10),
        width: scaledWidth,
        height: scaledHeight,
        image,
      }
    }

    const render = () => {
      if (context) {
        draw(context)
      }
      if (!gameHasEnded && isStarted) {
        tickCount += 1
        if (jumpRef.current) {
          lastJumpPress = frameCount
          jumpRef.current = false
        }
        const shortTimeSinceLastTimeJumped = frameCount - lastJumpPress < 20
        const shouldJump = shortTimeSinceLastTimeJumped && playerY === 0
        if (shouldJump) {
          playerYVelocity = 5
        }
        if (playerYVelocity > -10) {
          playerYVelocity -= 0.07
        }
        playerY += playerYVelocity
        if (playerY <= 0) {
          playerY = 0
          playerYVelocity = 0
        }
        const obstacleMoveSpeed = 2.5
        currentObstacles = currentObstacles
          .map((obstacle) => {
            return { ...obstacle, x: obstacle.x - obstacleMoveSpeed }
          })
          .filter((obstacle) => obstacle.x > -1000)
        if (
          currentObstacles.length === 0 ||
          currentObstacles[currentObstacles.length - 1].x < canvas.width - 200
        ) {
          currentObstacles = [...currentObstacles, createObstacle()]
        }
        groundSpecs = groundSpecs
          .map((spec) => {
            return { ...spec, x: spec.x - obstacleMoveSpeed }
          })
          .filter((spec) => spec.x > -1000)
        groundSpecs = [...groundSpecs, createSpec()]
      }
      frameCount += 1
      animationFrameId = window.requestAnimationFrame(render)
    }
    render()

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [restart, isStarted])

  const doRestart = () => {
    setIsEnd(false)
    setRestart(!restart)
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div
        onClick={handleClick}
        onKeyDown={handleKeyPress}
        tabIndex={0}
        style={{ width: 750, height: 300, border: 'solid', position: 'relative' }}
      >
        <canvas ref={canvasRef} height="300" width="750" />
        {isEnd && (
          <button
            style={{
              position: 'absolute',
              width: 50,
              height: 50,
              left: 350,
              top: 125,
              border: 'none',
              background: 'none',
              zIndex: 1000,
              cursor: 'pointer',
            }}
            onClick={() => doRestart()}
          >
            <img src="Restart.svg" alt="Restart" />
          </button>
        )}
      </div>
    </div>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <DinoGame />
  </React.StrictMode>,
  document.getElementById('root')
)
