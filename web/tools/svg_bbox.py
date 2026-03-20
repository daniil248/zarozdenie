"""Approximate bbox of all paths in an SVG (samples along path)."""
import sys
import xml.etree.ElementTree as ET

from svg.path import parse_path


def path_bbox(d: str, samples: int = 400):
    p = parse_path(d)
    xs, ys = [], []
    for i in range(samples + 1):
        t = i / samples
        z = p.point(t)
        xs.append(z.real)
        ys.append(z.imag)
    return min(xs), max(xs), min(ys), max(ys)


def main(path):
    tree = ET.parse(path)
    root = tree.getroot()

    xmins, xmaxs, ymins, ymaxs = [], [], [], []
    for el in root.iter():
        tag = el.tag.split("}")[-1] if "}" in el.tag else el.tag
        if tag != "path":
            continue
        d = el.attrib.get("d")
        if not d:
            continue
        xmin, xmax, ymin, ymax = path_bbox(d)
        xmins.append(xmin)
        xmaxs.append(xmax)
        ymins.append(ymin)
        ymaxs.append(ymax)

    print("paths", len(xmins))
    gx0, gx1 = min(xmins), max(xmaxs)
    gy0, gy1 = min(ymins), max(ymaxs)
    print("x", gx0, gx1)
    print("y", gy0, gy1)
    print("size", gx1 - gx0, gy1 - gy0)
    pad = 20
    print("suggested viewBox:", f"{gx0-pad:.0f} {gy0-pad:.0f} {gx1-gx0+2*pad:.0f} {gy1-gy0+2*pad:.0f}")


if __name__ == "__main__":
    main(sys.argv[1])
