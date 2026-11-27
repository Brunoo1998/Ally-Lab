"""Build the Ally sprite atlas from the supplied transparent PNG references."""
import argparse
from PIL import Image, ImageDraw, ImageFilter

MOUTHS = [
    [(64,67),(64,63),(64,61),(64,64),(64,66),(65,67)],
    [(75,63),(76,63),(75,56),(76,63),(74,63),(75,62),(76,55),(77,63)],
    [(47,58),(49,59),(49,54),(49,61),(48,61),(49,61),(50,55),(50,60)],
    [(64,59),(64,59),(64,58),(64,59)],
    [(64,80),(64,66),(64,48),(64,63),(64,76)],
    [(64,63),(65,67),(64,75),(64,84),(64,86),(64,75),(64,66),(64,63)],
    [(64,57),(64,57),(64,58),(63,58),(64,58),(64,57)],
    [(64,56),(64,56),(64,56),(64,59),(63,57),(64,56)],
    [(64,58),(58,58),(58,59),(59,59),(63,58),(64,58)],
    [(65,48),(78,48),(88,50),(96,54),(99,55),(96,64),(92,70),(84,75)],
    [(64,81),(57,81),(47,80),(41,77),(34,70),(32,67),(33,62),(34,57)],
]

def smile(frame, x, y):
    pixels = frame.load()
    for iy in range(y-5, y+6):
        for ix in range(x-8, x+9):
            red, green, blue, alpha = pixels[ix, iy]
            if red > green * 1.8 and red > blue * 1.4:
                pixels[ix, iy] = (max(green, blue), green, blue, alpha)
    smile_layer = Image.new('RGBA', frame.size)
    draw = ImageDraw.Draw(smile_layer)
    draw.arc((x-5,y-5,x+5,y+3), 10, 170, fill=(168,255,48,255), width=2)
    frame.alpha_composite(smile_layer.filter(ImageFilter.GaussianBlur(2)))
    frame.alpha_composite(smile_layer)

def build(sheet, portrait, output):
    atlas = Image.new('RGBA', (8*128, len(MOUTHS)*140))
    for row, mouths in enumerate(MOUTHS):
        for col, (x, y) in enumerate(mouths):
            frame = Image.new('RGBA', (128,140))
            frame.paste(sheet.crop((round(col*sheet.width/8),row*140,
                                    round((col+1)*sheet.width/8),min((row+1)*140,sheet.height))))
            frame.putalpha(frame.getchannel('A').point(lambda a: a if a >= 35 else 0))
            smile(frame,x,y)
            atlas.paste(frame,(col*128,row*140))
    atlas.save(output+'/ally-sprites.webp',quality=86,method=6)
    portrait.putalpha(portrait.getchannel('A').point(lambda a: a if a >= 35 else 0))
    portrait=portrait.crop(portrait.getchannel('A').getbbox())
    portrait.thumbnail((180,180),Image.Resampling.LANCZOS)
    portrait.save(output+'/ally-portrait.webp',quality=88,method=6)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sheet')
    parser.add_argument('portrait')
    parser.add_argument('output')
    args = parser.parse_args()
    build(Image.open(args.sheet).convert('RGBA'), Image.open(args.portrait).convert('RGBA'), args.output)
