import React, { useRef, useEffect, KeyboardEvent } from 'react'
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

  const handleClick = () => {
    jumpRef.current = true
  }

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'w') {
      jumpRef.current = true
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current as unknown as HTMLCanvasElement // sus
    const context: CanvasRenderingContext2D | null = canvas.getContext('2d')
    const obstacleTypes = [
      { targetHeight: 30, image: 'error.svg' },
      { targetHeight: 100, image: 'TiK.svg' },
      //{ targetHeight: 40, image: 'error.svg' },
    ]
    let animationFrameId: number
    let frameCount = 0
    let playerY = 0
    let playerYVelocity = 0
    let lastJumpPress = -1000
    let currentObstacles: Obstacle[] = []
    let tickCount = 0

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

    const playerHeight = 80

    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.width)
      ctx.fillStyle = 'black'
      const playerStartY = ctx.canvas.height - playerHeight - playerY
      const image = new Image()
      image.src = 'miukuMauku.svg'
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
          ctx.fillStyle = 'red'
          ctx.fillRect(obstacle.x, obstacleY, obstacle.width, obstacle.height)
        }
        ctx.drawImage(obstacle.image, obstacle.x, obstacleY, obstacle.width, obstacle.height)
      })
      const score = tickCount / 30
      ctx.fillStyle = 'black'
      ctx.font = '24px Common Pixel'
      const digits = 5
      const scoreText = score.toFixed(0)
      const zeroes = '0'.repeat(digits - scoreText.length)
      ctx.fillText(`${zeroes}${scoreText}`, ctx.canvas.width - 100, 100)
    }

    const createObstacle = (): Obstacle => {
      const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)]
      const image = new Image()
      image.src = obstacleType.image
      const multiplier = obstacleType.targetHeight / image.height
      const scaledWidth = image.width * multiplier
      const scaledHeight = image.height * multiplier
      return {
        x: canvas.width + Math.random() * 200 + 100,
        y: scaledHeight + Math.random() * 20,
        width: scaledWidth,
        height: scaledHeight,
        image,
      }
    }

    const render = () => {
      if (context) {
        tickCount += 1
        draw(context)
      }
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
        playerYVelocity -= 0.065
      }
      playerY += playerYVelocity
      if (playerY <= 0) {
        playerY = 0
        playerYVelocity = 0
      }
      currentObstacles = currentObstacles
        .map((obstacle) => {
          return { ...obstacle, x: obstacle.x - 2 }
        })
        .filter((obstacle) => obstacle.x > -1000)
      if (
        currentObstacles.length === 0 ||
        currentObstacles[currentObstacles.length - 1].x < canvas.width - 200
      ) {
        currentObstacles = [...currentObstacles, createObstacle()]
      }
      frameCount += 1
      animationFrameId = window.requestAnimationFrame(render)
    }
    render()

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div onClick={handleClick} onKeyDown={handleKeyPress} tabIndex={0}>
      <canvas ref={canvasRef} height="350" width="750" />
    </div>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <DinoGame />
  </React.StrictMode>,
  document.getElementById('root')
)
